import "server-only";
import { EnderecoNaoEncontradoError, ForaDaAreaError, freteKm, getConfigFrete, type EnderecoBusca } from "@/lib/server/frete";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizarRegra, precosEfetivos } from "@/lib/precos";
import { agoraNoFuso } from "@/lib/horario";
import { precoAgora } from "@/lib/promocao";

/**
 * Recalcula o pedido inteiro com os preços do banco.
 * O navegador manda só o que o cliente escolheu (IDs, nomes e quantidades);
 * nenhum preço vindo do navegador é usado.
 */

export class PedidoInvalidoError extends Error {}

type ItemRecebido = {
  id?: string | number;
  quantity?: number;
  observacao?: string;
  adicionaisSelecionados?: { id?: string | number; nome?: string }[];
  obrigatoriosSelecionados?: {
    id?: string | number;
    grupo?: string;
    nome?: string;
  }[];
};

export type ItemCalculado = {
  id: string;
  nome: string;
  imagem: string | null;
  quantity: number;
  observacao: string;
  precoBase: number;
  preco: number;
  adicionaisSelecionados: { id: string; nome: string; preco: number }[];
  obrigatoriosSelecionados: {
    id: string;
    grupo: string;
    nome: string;
    preco: number;
  }[];
};

const arred = (v: number) => Math.round(v * 100) / 100;
const texto = (v: unknown, max = 300) => String(v ?? "").trim().slice(0, max);

export async function calcularItens(
  restauranteId: string,
  itensRecebidos: unknown,
  opcoes: { uf?: string | null } = {}
): Promise<{ itens: ItemCalculado[]; subtotal: number }> {
  const agora = agoraNoFuso(opcoes.uf);
  if (!Array.isArray(itensRecebidos) || itensRecebidos.length === 0) {
    throw new PedidoInvalidoError("Seu carrinho está vazio.");
  }

  if (itensRecebidos.length > 100) {
    throw new PedidoInvalidoError("Pedido com itens demais.");
  }

  const itens = itensRecebidos as ItemRecebido[];
  const produtoIds = [...new Set(itens.map((i) => String(i.id ?? "")))].filter(Boolean);

  const { data: produtos, error: erroProdutos } = await supabaseAdmin
    .from("produtos")
    .select("*")
    .in("id", produtoIds)
    .eq("restaurante_id", restauranteId);

  if (erroProdutos) throw erroProdutos;

  const { data: adicionais, error: erroAdicionais } = await supabaseAdmin
    .from("adicionais")
    .select("id, produto_id, nome, preco")
    .in("produto_id", produtoIds);

  if (erroAdicionais) throw erroAdicionais;

  const { data: grupos, error: erroGrupos } = await supabaseAdmin
    .from("grupos_obrigatorios")
    .select("*, grupo_obrigatorio_opcoes(id, nome, preco)")
    .in("produto_id", produtoIds);

  if (erroGrupos) throw erroGrupos;

  const produtoPorId = new Map((produtos ?? []).map((p: any) => [String(p.id), p]));

  // Estoque: soma a quantidade de cada produto no carrinho.
  const pedidoPorProduto = new Map<string, number>();
  for (const item of itens) {
    const k = String(item.id ?? "");
    pedidoPorProduto.set(k, (pedidoPorProduto.get(k) ?? 0) + Math.max(0, Math.floor(Number(item.quantity) || 0)));
  }
  for (const [k, qtd] of pedidoPorProduto) {
    const p = produtoPorId.get(k);
    if (p && p.estoque != null && qtd > Number(p.estoque)) {
      throw new PedidoInvalidoError(
        Number(p.estoque) <= 0
          ? `${p.nome} esgotou. Tire do carrinho para continuar.`
          : `Só restam ${p.estoque} unidade(s) de ${p.nome}.`
      );
    }
  }

  const resultado: ItemCalculado[] = [];

  for (const item of itens) {
    const produto = produtoPorId.get(String(item.id ?? ""));

    if (!produto || produto.ativo === false) {
      throw new PedidoInvalidoError(
        "Um item do carrinho não está mais disponível. Atualize o cardápio e monte o pedido de novo."
      );
    }

    const quantidade = Math.floor(Number(item.quantity));

    if (!Number.isFinite(quantidade) || quantidade < 1 || quantidade > 99) {
      throw new PedidoInvalidoError("Quantidade inválida no carrinho.");
    }

    // ----- adicionais (opcionais) -----
    const adicionaisDoProduto = (adicionais ?? []).filter(
      (a: any) => String(a.produto_id) === String(produto.id)
    );

    const adicionaisEscolhidos = (item.adicionaisSelecionados ?? []).map((sel) => {
      // Procura pelo ID; se o dono editou o produto (IDs mudam), procura pelo nome.
      const encontrado =
        (sel.id != null && adicionaisDoProduto.find((a: any) => String(a.id) === String(sel.id))) ||
        adicionaisDoProduto.find((a: any) => a.nome === sel.nome);

      if (!encontrado) {
        throw new PedidoInvalidoError(
          `O adicional "${texto(sel.nome, 60)}" não está mais disponível.`
        );
      }

      return {
        id: String(encontrado.id),
        nome: String(encontrado.nome),
        preco: Number(encontrado.preco || 0),
      };
    });

    // ----- grupos obrigatórios -----
    const gruposDoProduto = (grupos ?? []).filter(
      (g: any) => String(g.produto_id) === String(produto.id)
    );

    const obrigatoriosEscolhidos = (item.obrigatoriosSelecionados ?? []).map((sel) => {
      for (const grupo of gruposDoProduto as any[]) {
        const opcoes = grupo.grupo_obrigatorio_opcoes ?? [];
        const opcao =
          (sel.id != null && opcoes.find((o: any) => String(o.id) === String(sel.id))) ||
          (grupo.nome === sel.grupo || !sel.grupo
            ? opcoes.find((o: any) => o.nome === sel.nome)
            : undefined);

        if (opcao) {
          return {
            id: String(opcao.id),
            grupoId: String(grupo.id),
            grupo: String(grupo.nome),
            nome: String(opcao.nome),
            preco: Number(opcao.preco || 0),
          };
        }
      }

      throw new PedidoInvalidoError(
        `A opção "${texto(sel.nome, 60)}" não está mais disponível.`
      );
    });

    // Meio a meio: ajusta o preço das opções pela regra do grupo.
    for (const grupo of gruposDoProduto as any[]) {
      const doGrupo = obrigatoriosEscolhidos.filter((o) => o.grupoId === String(grupo.id));
      const ajustados = precosEfetivos(doGrupo.map((o) => o.preco), normalizarRegra(grupo.regra_preco));
      doGrupo.forEach((o, i) => (o.preco = ajustados[i]));
    }

    for (const grupo of gruposDoProduto as any[]) {
      const qtd = obrigatoriosEscolhidos.filter((o) => o.grupoId === String(grupo.id)).length;
      const minimo = Number(grupo.minimo ?? 0);
      const maximo = Number(grupo.maximo ?? 999);

      if (qtd < minimo || (maximo !== 999 && qtd > maximo)) {
        throw new PedidoInvalidoError(
          `Escolha as opções de "${grupo.nome}" em ${produto.nome}.`
        );
      }
    }

    // Preço do momento (promoção por dia/horário entra aqui).
    const precoBase = precoAgora(produto, agora);
    const precoUnitario = arred(
      precoBase +
        adicionaisEscolhidos.reduce((s, a) => s + a.preco, 0) +
        obrigatoriosEscolhidos.reduce((s, o) => s + o.preco, 0)
    );

    resultado.push({
      id: String(produto.id),
      nome: String(produto.nome),
      imagem: produto.imagem ?? null,
      quantity: quantidade,
      observacao: texto(item.observacao),
      precoBase,
      preco: precoUnitario,
      adicionaisSelecionados: adicionaisEscolhidos,
      obrigatoriosSelecionados: obrigatoriosEscolhidos.map(({ grupoId: _g, ...resto }) => resto),
    });
  }

  const subtotal = arred(resultado.reduce((s, i) => s + i.preco * i.quantity, 0));

  return { itens: resultado, subtotal };
}

export async function calcularTaxaEntrega(
  restauranteId: string,
  tipoPedido: "entrega" | "retirada",
  bairro: string,
  endereco: EnderecoBusca = {}
): Promise<{ valor: number; km: number | null }> {
  if (tipoPedido === "retirada") return { valor: 0, km: null };

  const config = await getConfigFrete(restauranteId);

  if (config.modo === "km") {
    try {
      const { valor, km } = await freteKm(restauranteId, config, { ...endereco, bairro });
      return { valor: arred(valor), km };
    } catch (error) {
      if (error instanceof ForaDaAreaError || error instanceof EnderecoNaoEncontradoError) {
        throw new PedidoInvalidoError(error.message);
      }
      throw error;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("bairros_entrega")
    .select("valor")
    .eq("restaurante_id", restauranteId)
    .eq("bairro", bairro)
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    throw new PedidoInvalidoError("Este bairro não é atendido pelo restaurante.");
  }

  return { valor: arred(Number(data.valor || 0)), km: null };
}

export async function pedidoMinimo(restauranteId: string) {
  const { data } = await supabaseAdmin
    .from("aparencia")
    .select("pedido_minimo")
    .eq("restaurante_id", restauranteId)
    .limit(1)
    .maybeSingle();

  return Number(data?.pedido_minimo || 0);
}

/** Número sequencial por restaurante, sem duplicar em pedidos simultâneos. */
export async function proximoNumeroPedido(restauranteId: string) {
  const { data, error } = await supabaseAdmin.rpc("proximo_numero_pedido", {
    p_restaurante_id: restauranteId,
  });

  if (!error && data != null) return Number(data);

  // Fallback enquanto a função SQL não existir.
  const { data: ultimo } = await supabaseAdmin
    .from("pedidos")
    .select("numero_pedido")
    .eq("restaurante_id", restauranteId)
    .not("numero_pedido", "is", null)
    .order("numero_pedido", { ascending: false })
    .limit(1)
    .maybeSingle();

  return Number(ultimo?.numero_pedido ?? 0) + 1;
}

/** Dados do pedido que podem ser mostrados ao cliente final. */
export function pedidoPublico(pedido: any) {
  return {
    id: pedido.id,
    numero_pedido: pedido.numero_pedido,
    status: pedido.status,
    created_at: pedido.created_at,
    nome: String(pedido.nome || pedido.cliente || "").split(" ")[0],
    cliente: pedido.cliente || pedido.nome || "",
    subtotal: pedido.subtotal,
    taxa_entrega: pedido.taxa_entrega,
    desconto_fidelidade: pedido.desconto_fidelidade ?? 0,
    desconto_cupom: pedido.desconto_cupom ?? 0,
    cupom_codigo: pedido.cupom_codigo ?? null,
    premio_fidelidade: pedido.premio_fidelidade ?? null,
    total: pedido.total,
    total_pago: pedido.total_pago,
    payment_method: pedido.payment_method,
    payment_status: pedido.payment_status,
    tipo_pedido: pedido.tipo_pedido,
    mesa: pedido.mesa ?? null,
    retirada_no_local: pedido.retirada_no_local,
    endereco: pedido.endereco,
    bairro: pedido.bairro,
    rua: pedido.rua,
    numero: pedido.numero,
    complemento: pedido.complemento,
    referencia: pedido.referencia,
    observacoes: pedido.observacoes,
    troco_para: pedido.troco_para ?? null,
    itens: Array.isArray(pedido.itens) ? pedido.itens : [],
    restaurante_id: pedido.restaurante_id,
  };
}
