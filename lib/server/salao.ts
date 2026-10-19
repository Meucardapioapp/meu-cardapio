import "server-only";

import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { calcularItens, PedidoInvalidoError, type ItemCalculado } from "@/lib/server/pedido";
import { contabilizarPedido } from "@/lib/server/fidelidade";

/**
 * Restaurante (salão): comandas por mesa, itens lançados pelo garçom (ou
 * pelo QR Code da mesa), preparo por setor e fechamento da conta.
 * Todos os preços são recalculados aqui com o cardápio do banco.
 */

export class SalaoError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export const FORMAS_PAGAMENTO = ["pix", "debito", "credito", "dinheiro", "outro"] as const;
export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number];
export const NOME_FORMA: Record<FormaPagamento, string> = {
  pix: "Pix",
  debito: "Débito",
  credito: "Crédito",
  dinheiro: "Dinheiro",
  outro: "Outro",
};

/** Setor "Sem preparo": o item não vai para a cozinha (ex.: refrigerante da geladeira). */
export const SEM_PREPARO = "nenhum";

const arred = (v: number) => Math.round(Number(v || 0) * 100) / 100;

export type ConfigSalao = { setores: string[]; taxa_percentual: number; taxa_ligada_padrao: boolean };

export async function getConfigSalao(restauranteId: string): Promise<ConfigSalao> {
  const { data } = await supabaseAdmin
    .from("salao_config")
    .select("setores, taxa_percentual, taxa_ligada_padrao")
    .eq("restaurante_id", restauranteId)
    .maybeSingle();
  const setores = Array.isArray(data?.setores) && data.setores.length ? data.setores.map(String) : ["Cozinha", "Churrasqueira", "Bar"];
  return {
    setores,
    taxa_percentual: Number(data?.taxa_percentual ?? 10),
    taxa_ligada_padrao: Boolean(data?.taxa_ligada_padrao),
  };
}

/** Palpite de setor quando o dono ainda não configurou a categoria. */
export function setorSugerido(categoria: string, setores: string[]) {
  const c = categoria.toLowerCase();
  const tem = (nome: string) => setores.find((s) => s.toLowerCase() === nome);
  // Bebida normalmente sai da geladeira: sem preparo (o dono muda para "Bar" se quiser).
  if (/bebida|refri|suco|cerveja|drink|água|agua|vinho|dose|chopp|refrigerante/.test(c)) return SEM_PREPARO;
  if (/espeto|churras|carne|grelha|costela|picanha/.test(c)) return tem("churrasqueira") ?? setores[0];
  return setores[0] ?? "Cozinha";
}

/** Setor de preparo de cada produto (pela categoria). */
export async function setoresDosProdutos(restauranteId: string, produtoIds: string[]) {
  const config = await getConfigSalao(restauranteId);
  const [{ data: produtos }, { data: categorias }] = await Promise.all([
    supabaseAdmin.from("produtos").select("id, categoria").eq("restaurante_id", restauranteId).in("id", produtoIds),
    supabaseAdmin.from("categorias").select("nome, setor_preparo").eq("restaurante_id", restauranteId),
  ]);
  const porCategoria = new Map((categorias ?? []).map((c: any) => [String(c.nome), c.setor_preparo as string | null]));
  const mapa = new Map<string, string | null>();
  for (const p of produtos ?? []) {
    const categoria = String(p.categoria || "Outros");
    const configurado = porCategoria.get(categoria);
    const setor = configurado || setorSugerido(categoria, config.setores);
    mapa.set(String(p.id), setor === SEM_PREPARO ? null : setor);
  }
  return mapa;
}

/** "Sabor: Calabresa", "+ Bacon"… (o que a cozinha precisa saber do item). */
function detalhesDoItem(item: ItemCalculado) {
  return [
    ...item.obrigatoriosSelecionados.map((o) => `${o.grupo}: ${o.nome}`),
    ...item.adicionaisSelecionados.map((a) => `+ ${a.nome}`),
  ];
}

const limpar = (v: unknown, max = 200) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, max);
export const normalizarMesa = (v: unknown) => limpar(v, 12).replace(/[^0-9A-Za-zÀ-ú -]/g, "").trim();

type Autor = { tipo: "garcom" | "painel" | "qr"; id?: string | null; nome: string };

/** Comanda aberta da mesa (ou abre uma nova). */
export async function abrirComanda(
  restauranteId: string,
  mesaBruta: unknown,
  opcoes: { autor: Autor; pessoas?: number | null; clienteNome?: string | null }
) {
  const mesa = normalizarMesa(mesaBruta);
  if (!mesa) throw new SalaoError("Digite o número da mesa.");

  const existente = await comandaAbertaDaMesa(restauranteId, mesa);
  if (existente) return { comanda: existente, nova: false };

  const config = await getConfigSalao(restauranteId);

  for (let tentativa = 0; tentativa < 4; tentativa++) {
    const { data: ultima } = await supabaseAdmin
      .from("comandas")
      .select("numero")
      .eq("restaurante_id", restauranteId)
      .order("numero", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await supabaseAdmin
      .from("comandas")
      .insert({
        restaurante_id: restauranteId,
        numero: Number(ultima?.numero ?? 0) + 1,
        mesa,
        pessoas: opcoes.pessoas && opcoes.pessoas > 0 ? Math.min(Math.floor(opcoes.pessoas), 99) : null,
        cliente_nome: opcoes.clienteNome ? limpar(opcoes.clienteNome, 60) : null,
        garcom_id: opcoes.autor.tipo === "garcom" ? opcoes.autor.id : null,
        garcom_nome: opcoes.autor.tipo === "garcom" ? opcoes.autor.nome : null,
        taxa_servico: config.taxa_ligada_padrao,
        taxa_percentual: config.taxa_percentual,
      })
      .select("*")
      .single();

    if (!error) return { comanda: data, nova: true };
    if (error.code !== "23505") throw error;

    // Outro garçom abriu a mesma mesa ao mesmo tempo: usa a dele.
    const aberta = await comandaAbertaDaMesa(restauranteId, mesa);
    if (aberta) return { comanda: aberta, nova: false };
  }
  throw new SalaoError("Não foi possível abrir a mesa. Tente de novo.");
}

async function comandaAbertaDaMesa(restauranteId: string, mesa: string) {
  const { data } = await supabaseAdmin
    .from("comandas")
    .select("*")
    .eq("restaurante_id", restauranteId)
    .eq("status", "aberta")
    .ilike("mesa", mesa.replace(/[%_]/g, ""))
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getComanda(restauranteId: string, comandaId: string) {
  const { data: comanda } = await supabaseAdmin
    .from("comandas")
    .select("*")
    .eq("id", comandaId)
    .eq("restaurante_id", restauranteId)
    .maybeSingle();
  if (!comanda) throw new SalaoError("Comanda não encontrada.", 404);
  return comanda;
}

/** Comanda com os itens (ordem de lançamento). */
export async function detalharComanda(restauranteId: string, comandaId: string) {
  const comanda = await getComanda(restauranteId, comandaId);
  const { data: itens, error } = await supabaseAdmin
    .from("comanda_itens")
    .select("*")
    .eq("comanda_id", comandaId)
    .order("criado_em", { ascending: true });
  if (error) throw error;
  return { comanda, itens: itens ?? [] };
}

/** Soma os itens e grava subtotal, 10% e total na comanda. */
export async function recalcularComanda(comandaId: string, mudancas: Record<string, unknown> = {}) {
  const { data: comanda } = await supabaseAdmin.from("comandas").select("*").eq("id", comandaId).single();
  const { data: itens } = await supabaseAdmin
    .from("comanda_itens")
    .select("quantidade, preco_unit, status")
    .eq("comanda_id", comandaId);

  const atual = { ...comanda, ...mudancas };
  const subtotal = arred(
    (itens ?? []).filter((i) => i.status !== "cancelado").reduce((s, i) => s + Number(i.preco_unit) * Number(i.quantidade), 0)
  );
  const taxa = atual.taxa_servico ? arred((subtotal * Number(atual.taxa_percentual || 0)) / 100) : 0;
  const desconto = Math.min(arred(Number(atual.desconto || 0)), arred(subtotal + taxa));
  const total = arred(subtotal + taxa - desconto);

  const { data, error } = await supabaseAdmin
    .from("comandas")
    .update({ ...mudancas, subtotal, taxa_valor: taxa, desconto, total, atualizada_em: new Date().toISOString() })
    .eq("id", comandaId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/** Lança itens na comanda (vão para a cozinha/churrasqueira/bar). */
export async function lancarItens(
  restauranteId: string,
  comandaId: string,
  itensRecebidos: unknown,
  autor: Autor,
  opcoes: { uf?: string | null; itensJaCalculados?: ItemCalculado[] } = {}
) {
  const comanda = await getComanda(restauranteId, comandaId);
  if (comanda.status !== "aberta") throw new SalaoError("Esta mesa já foi fechada.", 409);

  let itens: ItemCalculado[];
  try {
    itens = opcoes.itensJaCalculados ?? (await calcularItens(restauranteId, itensRecebidos, { uf: opcoes.uf })).itens;
  } catch (e) {
    if (e instanceof PedidoInvalidoError) throw new SalaoError(e.message);
    throw e;
  }
  if (!itens.length) throw new SalaoError("Escolha pelo menos um item.");

  const setores = await setoresDosProdutos(restauranteId, [...new Set(itens.map((i) => i.id))]);
  const lancamento = randomUUID();
  const agora = new Date().toISOString();

  const linhas = itens.map((item) => {
    const setor = setores.get(item.id) ?? null;
    return {
      comanda_id: comandaId,
      restaurante_id: restauranteId,
      lancamento,
      produto_id: item.id,
      nome: item.nome,
      detalhes: detalhesDoItem(item),
      observacao: item.observacao || null,
      quantidade: item.quantity,
      preco_unit: item.preco,
      setor,
      // Sem preparo (bebida da geladeira): já fica pronto para levar.
      status: setor ? "novo" : "pronto",
      pronto_em: setor ? null : agora,
      origem: autor.tipo,
      lancado_por_id: autor.tipo === "garcom" ? autor.id : null,
      lancado_por: autor.nome,
      criado_em: agora,
    };
  });

  const { error } = await supabaseAdmin.from("comanda_itens").insert(linhas);
  if (error) throw error;

  // Garçom que lança numa mesa sem garçom passa a ser o responsável.
  const mudancas: Record<string, unknown> = { pediu_conta: false };
  if (autor.tipo === "garcom" && !comanda.garcom_id) {
    mudancas.garcom_id = autor.id;
    mudancas.garcom_nome = autor.nome;
  }
  const atualizada = await recalcularComanda(comandaId, mudancas);
  return { comanda: atualizada, lancamento, quantidade: linhas.length };
}

/**
 * Alterar um item: mudar a quantidade ou cancelar.
 * O garçom só altera o que a cozinha ainda não preparou; o painel altera tudo.
 */
export async function alterarItem(
  restauranteId: string,
  itemId: string,
  mudanca: { quantidade?: number; cancelar?: boolean; observacao?: string; entregue?: boolean },
  autor: Autor,
  opcoes: { somenteNaoPreparado?: boolean; garcomId?: string } = {}
) {
  const { data: item } = await supabaseAdmin
    .from("comanda_itens")
    .select("*, comandas(status)")
    .eq("id", itemId)
    .eq("restaurante_id", restauranteId)
    .maybeSingle();
  if (!item) throw new SalaoError("Item não encontrado.", 404);
  const statusComanda = (Array.isArray(item.comandas) ? item.comandas[0] : item.comandas)?.status;
  if (statusComanda !== "aberta") throw new SalaoError("Esta mesa já foi fechada.", 409);
  if (item.status === "cancelado") throw new SalaoError("Este item já foi cancelado.", 409);

  const agora = new Date().toISOString();
  const atualizar: Record<string, unknown> = {};

  if (mudanca.entregue) {
    atualizar.status = "entregue";
    atualizar.entregue_em = agora;
  } else {
    // Sem preparo (bebida da geladeira) o garçom também pode corrigir.
    const semPreparo = !item.setor && item.status === "pronto";
    if (opcoes.somenteNaoPreparado && item.status !== "novo" && !semPreparo) {
      throw new SalaoError("A cozinha já preparou este item. Peça para o caixa alterar no painel.", 409);
    }
    if (mudanca.cancelar) {
      atualizar.status = "cancelado";
      atualizar.cancelado_em = agora;
      atualizar.cancelado_por = autor.nome;
    } else {
      if (mudanca.quantidade != null) {
        const q = Math.floor(Number(mudanca.quantidade));
        if (!Number.isFinite(q) || q < 1 || q > 99) throw new SalaoError("Quantidade inválida.");
        atualizar.quantidade = q;
      }
      if (mudanca.observacao != null) atualizar.observacao = limpar(mudanca.observacao, 200) || null;
      if (!Object.keys(atualizar).length) throw new SalaoError("Nada para alterar.");
      atualizar.alterado_em = agora;
    }
  }

  const { error } = await supabaseAdmin.from("comanda_itens").update(atualizar).eq("id", itemId);
  if (error) throw error;
  return recalcularComanda(item.comanda_id);
}

/** Liga/desliga os 10%, desconto, pessoas, nome, troca de mesa, "pediu a conta". */
export async function ajustarComanda(
  restauranteId: string,
  comandaId: string,
  ajuste: { taxaServico?: boolean; desconto?: number; pessoas?: number | null; pediuConta?: boolean; mesa?: string; clienteNome?: string }
) {
  const comanda = await getComanda(restauranteId, comandaId);
  if (comanda.status !== "aberta") throw new SalaoError("Esta mesa já foi fechada.", 409);

  const mudancas: Record<string, unknown> = {};
  if (typeof ajuste.taxaServico === "boolean") mudancas.taxa_servico = ajuste.taxaServico;
  if (ajuste.desconto != null) {
    const d = arred(Number(ajuste.desconto));
    if (!(d >= 0)) throw new SalaoError("Desconto inválido.");
    mudancas.desconto = d;
  }
  if (ajuste.pessoas !== undefined) mudancas.pessoas = ajuste.pessoas && ajuste.pessoas > 0 ? Math.min(Math.floor(ajuste.pessoas), 99) : null;
  if (typeof ajuste.pediuConta === "boolean") mudancas.pediu_conta = ajuste.pediuConta;
  if (ajuste.clienteNome !== undefined) mudancas.cliente_nome = limpar(ajuste.clienteNome, 60) || null;
  if (ajuste.mesa !== undefined) {
    const mesa = normalizarMesa(ajuste.mesa);
    if (!mesa) throw new SalaoError("Digite o número da mesa.");
    const outra = await comandaAbertaDaMesa(restauranteId, mesa);
    if (outra && outra.id !== comandaId) throw new SalaoError(`A mesa ${mesa} já está aberta. Feche ou junte antes.`, 409);
    mudancas.mesa = mesa;
  }

  try {
    return await recalcularComanda(comandaId, mudancas);
  } catch (e: any) {
    if (e?.code === "23505") throw new SalaoError("Essa mesa já está aberta.", 409);
    throw e;
  }
}

export type Pagamento = { forma: FormaPagamento; valor: number };

/** Fecha a conta: confere os pagamentos e grava (entra no relatório). */
export async function fecharComanda(
  restauranteId: string,
  comandaId: string,
  dados: { pagamentos: unknown; taxaServico?: boolean; desconto?: number; recebidoDinheiro?: number },
  autor: Autor
) {
  const comanda = await getComanda(restauranteId, comandaId);
  if (comanda.status !== "aberta") throw new SalaoError("Esta mesa já foi fechada.", 409);

  // Recalcula com os 10% e o desconto escolhidos agora.
  const mudancas: Record<string, unknown> = {};
  if (typeof dados.taxaServico === "boolean") mudancas.taxa_servico = dados.taxaServico;
  if (dados.desconto != null) mudancas.desconto = Math.max(0, arred(Number(dados.desconto)));
  const atual = await recalcularComanda(comandaId, mudancas);

  const aPagar = arred(Number(atual.total) - Number(atual.pago_antecipado || 0));

  const lista = (Array.isArray(dados.pagamentos) ? dados.pagamentos : [])
    .map((p: any) => ({ forma: String(p?.forma) as FormaPagamento, valor: arred(Number(p?.valor)) }))
    .filter((p) => FORMAS_PAGAMENTO.includes(p.forma) && p.valor > 0);

  if (aPagar > 0 && !lista.length) throw new SalaoError("Escolha a forma de pagamento.");

  const somado = arred(lista.reduce((s, p) => s + p.valor, 0));
  if (lista.length && Math.abs(somado - aPagar) > 0.009) {
    throw new SalaoError(`Os pagamentos somam ${somado.toFixed(2).replace(".", ",")}, mas a conta é ${aPagar.toFixed(2).replace(".", ",")}.`);
  }

  // Troco: só sobre a parte em dinheiro.
  const emDinheiro = lista.filter((p) => p.forma === "dinheiro").reduce((s, p) => s + p.valor, 0);
  const recebido = arred(Number(dados.recebidoDinheiro || 0));
  const troco = emDinheiro > 0 && recebido > emDinheiro ? arred(recebido - emDinheiro) : 0;

  const formas = [...new Set(lista.map((p) => p.forma))];
  const { data, error } = await supabaseAdmin
    .from("comandas")
    .update({
      status: "fechada",
      pediu_conta: false,
      pagamentos: lista,
      forma_pagamento: formas.length > 1 ? "misto" : formas[0] ?? (Number(atual.pago_antecipado) > 0 ? "antecipado" : null),
      troco,
      fechada_em: new Date().toISOString(),
      fechada_por: autor.nome,
    })
    .eq("id", comandaId)
    .eq("status", "aberta")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new SalaoError("Esta mesa já foi fechada.", 409);

  // O que ainda estava na cozinha sai da tela do preparo.
  await supabaseAdmin
    .from("comanda_itens")
    .update({ status: "entregue", entregue_em: new Date().toISOString() })
    .eq("comanda_id", comandaId)
    .in("status", ["novo", "pronto"]);

  // Pedidos do QR Code desta mesa: concluídos (o cliente vê no acompanhamento).
  await supabaseAdmin
    .from("pedidos")
    .update({ status: "concluido" })
    .eq("comanda_id", comandaId)
    .not("status", "in", "(recusado,cancelado)");

  return data;
}

/** Reabre uma conta fechada por engano (desde que a mesa esteja livre). */
export async function reabrirComanda(restauranteId: string, comandaId: string) {
  const comanda = await getComanda(restauranteId, comandaId);
  if (comanda.status === "aberta") return comanda;
  const outra = await comandaAbertaDaMesa(restauranteId, comanda.mesa);
  if (outra) throw new SalaoError(`A mesa ${comanda.mesa} já tem outra comanda aberta.`, 409);
  const { data, error } = await supabaseAdmin
    .from("comandas")
    .update({ status: "aberta", fechada_em: null, fechada_por: null, pagamentos: [], forma_pagamento: null, troco: 0 })
    .eq("id", comandaId)
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") throw new SalaoError(`A mesa ${comanda.mesa} já tem outra comanda aberta.`, 409);
    throw error;
  }
  return data;
}

/** Cancela uma mesa aberta por engano (não entra no relatório). */
export async function cancelarComanda(restauranteId: string, comandaId: string, autor: Autor) {
  const comanda = await getComanda(restauranteId, comandaId);
  if (comanda.status !== "aberta") throw new SalaoError("Só dá para cancelar mesa aberta.", 409);
  const agora = new Date().toISOString();
  await supabaseAdmin
    .from("comanda_itens")
    .update({ status: "cancelado", cancelado_em: agora, cancelado_por: autor.nome })
    .eq("comanda_id", comandaId)
    .neq("status", "cancelado");
  const { data, error } = await supabaseAdmin
    .from("comandas")
    .update({ status: "cancelada", fechada_em: agora, fechada_por: autor.nome, pediu_conta: false })
    .eq("id", comandaId)
    .select("*")
    .single();
  if (error) throw error;
  const { data: doQr } = await supabaseAdmin
    .from("pedidos")
    .update({ status: "cancelado" })
    .eq("comanda_id", comandaId)
    .select("id");
  for (const p of doQr ?? []) await contabilizarPedido(p.id, false).catch(() => {});
  return data;
}

/** Comandas abertas com o resumo para a tela de mesas. */
export async function listarAbertas(restauranteId: string) {
  const { data: comandas, error } = await supabaseAdmin
    .from("comandas")
    .select("*")
    .eq("restaurante_id", restauranteId)
    .eq("status", "aberta")
    .order("aberta_em", { ascending: true })
    .limit(300);
  if (error) throw error;

  const ids = (comandas ?? []).map((c) => c.id);
  const { data: itens } = ids.length
    ? await supabaseAdmin
        .from("comanda_itens")
        .select("comanda_id, status, criado_em, quantidade, setor, origem")
        .in("comanda_id", ids)
        .neq("status", "cancelado")
    : { data: [] as any[] };

  return (comandas ?? []).map((c) => {
    const meus = (itens ?? []).filter((i) => i.comanda_id === c.id);
    return {
      ...c,
      itens_total: meus.reduce((s, i) => s + Number(i.quantidade), 0),
      itens_preparando: meus.filter((i) => i.status === "novo").reduce((s, i) => s + Number(i.quantidade), 0),
      itens_prontos: meus.filter((i) => i.status === "pronto" && i.setor).reduce((s, i) => s + Number(i.quantidade), 0),
      // Último pedido do garçom ou do QR (o que o caixa lançou não acende o aviso).
      ultimo_lancamento: meus
        .filter((i) => i.origem !== "painel")
        .reduce((m: string | null, i) => (!m || i.criado_em > m ? i.criado_em : m), null),
    };
  });
}

/**
 * Pedido feito pelo QR Code da mesa: entra na comanda da mesa (abre se
 * precisar). Pix online só entra depois de pago, como valor já pago.
 * Se der qualquer erro, o pedido continua no painel de Pedidos.
 */
export async function lancarPedidoDoQr(pedidoId: string | number) {
  try {
    const { data: p } = await supabaseAdmin
      .from("pedidos")
      .select("id, restaurante_id, mesa, cliente, itens, total, payment_method, payment_status, comanda_id, numero_pedido, observacoes")
      .eq("id", pedidoId)
      .maybeSingle();
    if (!p?.mesa || p.comanda_id) return;
    if (p.payment_method === "pix" && p.payment_status !== "approved") return;

    const restauranteId = String(p.restaurante_id);
    const autor: Autor = { tipo: "qr", nome: `QR da mesa (${String(p.cliente || "cliente").split(" ")[0]})` };
    const { comanda } = await abrirComanda(restauranteId, p.mesa, { autor, clienteNome: p.cliente });

    const itens = (Array.isArray(p.itens) ? p.itens : []).map((i: any) => ({
      id: String(i.id),
      nome: String(i.nome),
      imagem: null,
      quantity: Math.max(1, Math.floor(Number(i.quantity) || 1)),
      observacao: [i.observacao, p.observacoes].filter(Boolean).join(" · ").slice(0, 200),
      precoBase: Number(i.precoBase ?? i.preco ?? 0),
      preco: Number(i.preco ?? 0),
      adicionaisSelecionados: Array.isArray(i.adicionaisSelecionados) ? i.adicionaisSelecionados : [],
      obrigatoriosSelecionados: Array.isArray(i.obrigatoriosSelecionados) ? i.obrigatoriosSelecionados : [],
    })) as ItemCalculado[];
    if (!itens.length) return;

    // Marca primeiro (evita lançar duas vezes se o aviso chegar repetido).
    const { data: reservado } = await supabaseAdmin
      .from("pedidos")
      .update({ comanda_id: comanda.id, status: "aceito" })
      .eq("id", p.id)
      .is("comanda_id", null)
      .select("id")
      .maybeSingle();
    if (!reservado) return;

    try {
      await lancarItens(restauranteId, comanda.id, null, autor, { itensJaCalculados: itens });
      if (p.payment_method === "pix") {
        const { data: c } = await supabaseAdmin.from("comandas").select("pago_antecipado").eq("id", comanda.id).single();
        await recalcularComanda(comanda.id, { pago_antecipado: arred(Number(c?.pago_antecipado || 0) + Number(p.total || 0)) });
      }
    } catch (e) {
      // Volta para o painel de Pedidos para não perder o pedido.
      await supabaseAdmin.from("pedidos").update({ comanda_id: null, status: "pendente" }).eq("id", p.id);
      throw e;
    }
  } catch (e) {
    console.error("[salao] pedido do QR não entrou na comanda", pedidoId, e instanceof Error ? e.message : e);
  }
}
