import "server-only";

import { emailPagamentoConfirmado } from "@/lib/server/notificacoes";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  DIAS_TESTE_GRATIS,
  DIAS_TOLERANCIA,
  PLANOS,
  type EstadoAssinatura,
  type PlanoId,
  type StatusAssinatura,
} from "@/lib/planos";
import { PagarmeError, pagarme } from "@/lib/server/pagarme";

const DIA_MS = 24 * 60 * 60 * 1000;

type LinhaAssinatura = {
  restaurante_id: string;
  status: StatusAssinatura;
  plano: PlanoId | null;
  metodo: "cartao" | "pix" | null;
  acesso_ate: string;
  pagarme_subscription_id: string | null;
  pagarme_customer_id: string | null;
  cartao_final: string | null;
  cartao_bandeira: string | null;
};

function montarEstado(linha: LinhaAssinatura): EstadoAssinatura {
  const acessoAte = new Date(linha.acesso_ate);
  const agora = Date.now();
  const ativo = acessoAte.getTime() > agora && linha.status !== "expirada";

  let status = linha.status;

  if (!ativo && (status === "trial" || status === "ativa" || status === "inadimplente")) {
    status = "expirada";
  }

  return {
    status,
    ativo,
    plano: linha.plano,
    metodo: linha.metodo,
    acessoAte: acessoAte.toISOString(),
    diasRestantes: Math.max(0, Math.ceil((acessoAte.getTime() - agora) / DIA_MS)),
    cartaoFinal: linha.cartao_final,
    cartaoBandeira: linha.cartao_bandeira,
  };
}

/**
 * Lê (ou cria) a assinatura do restaurante.
 * Restaurante sem linha ganha o teste grátis a partir de agora.
 */
export async function getLinhaAssinatura(
  restauranteId: string
): Promise<LinhaAssinatura> {
  const { data, error } = await supabaseAdmin
    .from("assinaturas")
    .select("*")
    .eq("restaurante_id", restauranteId)
    .maybeSingle();

  if (error) throw error;

  if (data) return data as LinhaAssinatura;

  return criarTesteGratis(restauranteId);
}

export async function criarTesteGratis(restauranteId: string) {
  const linha = {
    restaurante_id: restauranteId,
    status: "trial" as const,
    plano: null,
    metodo: null,
    acesso_ate: new Date(Date.now() + DIAS_TESTE_GRATIS * DIA_MS).toISOString(),
    pagarme_subscription_id: null,
    pagarme_customer_id: null,
    cartao_final: null,
    cartao_bandeira: null,
  };

  const { data, error } = await supabaseAdmin
    .from("assinaturas")
    .upsert(linha, { onConflict: "restaurante_id", ignoreDuplicates: true })
    .select("*")
    .maybeSingle();

  if (error) throw error;

  if (data) return data as LinhaAssinatura;

  // Já existia (corrida entre duas requisições): lê de novo.
  const { data: existente, error: erroLeitura } = await supabaseAdmin
    .from("assinaturas")
    .select("*")
    .eq("restaurante_id", restauranteId)
    .single();

  if (erroLeitura) throw erroLeitura;

  return existente as LinhaAssinatura;
}

export async function getEstadoAssinatura(restauranteId: string) {
  return montarEstado(await getLinhaAssinatura(restauranteId));
}

/** Regra única usada pelo checkout: o restaurante pode receber pedidos? */
export async function restaurantePodeReceberPedidos(restauranteId: string) {
  try {
    const estado = await getEstadoAssinatura(restauranteId);
    return estado.ativo;
  } catch (error) {
    // Se a tabela ainda não existir (SQL não rodado), não derruba as vendas.
    console.error("[assinatura] falha ao verificar", error);
    return true;
  }
}

/**
 * Estende o acesso depois de um pagamento confirmado.
 * Conta a partir do maior entre agora e o acesso atual.
 */
export async function estenderAcesso(
  restauranteId: string,
  plano: PlanoId,
  metodo: "cartao" | "pix",
  dias: number = PLANOS[plano].dias
) {
  const linha = await getLinhaAssinatura(restauranteId);
  const base = Math.max(Date.now(), new Date(linha.acesso_ate).getTime());
  const novoAcesso = new Date(base + dias * DIA_MS);

  const { error } = await supabaseAdmin
    .from("assinaturas")
    .update({
      status: "ativa",
      plano,
      metodo,
      acesso_ate: novoAcesso.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("restaurante_id", restauranteId);

  if (error) throw error;

  return novoAcesso;
}

/**
 * Busca a assinatura recorrente na Pagar.me (fonte da verdade)
 * e atualiza o acesso do restaurante.
 */
export async function sincronizarAssinaturaCartao(subscriptionId: string) {
  const assinatura = await pagarme<any>(`/subscriptions/${subscriptionId}`);

  let restauranteId: string | null =
    assinatura?.metadata?.restaurante_id ?? null;

  if (!restauranteId) {
    const { data } = await supabaseAdmin
      .from("assinaturas")
      .select("restaurante_id")
      .eq("pagarme_subscription_id", subscriptionId)
      .maybeSingle();

    restauranteId = data?.restaurante_id ?? null;
  }

  if (!restauranteId) {
    console.warn("[assinatura] assinatura sem restaurante", subscriptionId);
    return;
  }

  const linha = await getLinhaAssinatura(restauranteId);

  // Só vale para a assinatura atual (ignora uma antiga, trocada ou
  // cancelada porque o dono passou a pagar no Pix).
  if (linha.pagarme_subscription_id !== subscriptionId) {
    return;
  }

  const statusPagarme: string = assinatura?.status ?? "";

  const atualizacao: Record<string, unknown> = {
    pagarme_subscription_id: subscriptionId,
    updated_at: new Date().toISOString(),
  };

  if (statusPagarme === "canceled") {
    // O acesso já pago continua valendo até `acesso_ate`.
    atualizacao.status = "cancelada";
  } else if (statusPagarme === "failed") {
    atualizacao.status = "inadimplente";
  } else {
    return;
  }

  const { error } = await supabaseAdmin
    .from("assinaturas")
    .update(atualizacao)
    .eq("restaurante_id", restauranteId);

  if (error) throw error;
}

/**
 * Fatura da assinatura no cartão. Só uma fatura paga (confirmada
 * direto na API) libera acesso, e cada fatura conta uma única vez.
 */
export async function sincronizarFaturaCartao(invoiceId: string) {
  const fatura = await pagarme<any>(`/invoices/${invoiceId}`);
  const subscriptionId: string | null = fatura?.subscription?.id ?? null;

  if (!subscriptionId) return;

  const { data: linha } = await supabaseAdmin
    .from("assinaturas")
    .select("*")
    .eq("pagarme_subscription_id", subscriptionId)
    .maybeSingle();

  if (!linha) {
    console.warn("[assinatura] fatura sem restaurante", invoiceId);
    return;
  }

  if (fatura?.status === "failed" || fatura?.status === "canceled") {
    // Aviso atrasado de uma fatura antiga não derruba quem já pagou depois.
    const { data: ultimoPago } = await supabaseAdmin
      .from("pagamentos_assinatura")
      .select("pago_em")
      .eq("restaurante_id", linha.restaurante_id)
      .eq("status", "paid")
      .order("pago_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    const criadaEm = fatura?.created_at ? new Date(fatura.created_at).getTime() : Date.now();
    if (ultimoPago?.pago_em && new Date(ultimoPago.pago_em).getTime() > criadaEm) return;

    await supabaseAdmin
      .from("assinaturas")
      .update({ status: "inadimplente", updated_at: new Date().toISOString() })
      .eq("restaurante_id", linha.restaurante_id);
    return;
  }

  if (fatura?.status !== "paid") return;

  // Idempotência: a mesma fatura não estende o acesso duas vezes.
  const { error: erroRegistro } = await supabaseAdmin
    .from("pagamentos_assinatura")
    .insert({
      restaurante_id: linha.restaurante_id,
      pagarme_invoice_id: invoiceId,
      plano: linha.plano,
      metodo: "cartao",
      valor: Number(fatura?.amount ?? 0) / 100,
      status: "paid",
      pago_em: new Date().toISOString(),
    });

  if (erroRegistro) {
    if ((erroRegistro as any).code === "23505") return; // já processada
    throw erroRegistro;
  }

  const plano: PlanoId = "mensal";
  const fimCiclo = fatura?.cycle?.end_at ? new Date(fatura.cycle.end_at).getTime() : null;
  const pelaRegra = Date.now() + PLANOS[plano].dias * DIA_MS;
  const atual = new Date(linha.acesso_ate).getTime();
  // Quem assina durante o teste grátis (ou volta depois de cancelar, com
  // dias já pagos) não perde os dias que sobraram.
  const sobraDoTeste =
    linha.status === "trial" || linha.status === "cancelada" ? Math.max(0, atual - Date.now()) : 0;
  const ate = new Date((fimCiclo ?? pelaRegra) + sobraDoTeste + DIAS_TOLERANCIA * DIA_MS);

  const acessoNovo = new Date(Math.max(atual, ate.getTime()));
  await supabaseAdmin
    .from("assinaturas")
    .update({
      status: "ativa",
      metodo: "cartao",
      plano,
      acesso_ate: acessoNovo.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("restaurante_id", linha.restaurante_id);

  await emailPagamentoConfirmado(String(linha.restaurante_id), invoiceId, acessoNovo).catch(() => {});
}

// Plano anual antigo (retirado): só para algum Pix gerado antes da mudança.
const ANUAL_ANTIGO = { preco: 799, dias: 365 };

/**
 * Pix avulso do plano: confirma o pedido na API e estende o acesso
 * uma única vez.
 */
export async function confirmarPixAssinatura(order: any) {
  const restauranteId: string | undefined = order?.metadata?.restaurante_id;
  const planoPago: string | undefined = order?.metadata?.plano;

  if (!restauranteId || (planoPago !== "mensal" && planoPago !== "anual")) return;
  if (order?.status !== "paid") return;

  const plano: PlanoId = "mensal";
  const anualAntigo = planoPago === "anual";
  const esperado = Math.round((anualAntigo ? ANUAL_ANTIGO.preco : PLANOS.mensal.preco) * 100);
  if (Number(order?.amount) < esperado) {
    console.warn("[assinatura] valor pago menor que o plano", order?.id);
    return;
  }

  const { data: registro, error } = await supabaseAdmin
    .from("pagamentos_assinatura")
    .update({ status: "paid", pago_em: new Date().toISOString() })
    .eq("pagarme_order_id", order.id)
    .neq("status", "paid")
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!registro) return; // já processado ou desconhecido

  // Pagou no Pix: se havia cobrança automática no cartão, cancela
  // (evita cobrar duas vezes pelo mesmo período).
  const linha = await getLinhaAssinatura(restauranteId);
  if (linha.pagarme_subscription_id && linha.metodo === "cartao") {
    try {
      await pagarme(`/subscriptions/${linha.pagarme_subscription_id}`, { method: "DELETE" });
    } catch (e) {
      console.error("[assinatura] cancelar cartão após Pix", e);
    }
    await supabaseAdmin
      .from("assinaturas")
      .update({ pagarme_subscription_id: null, cartao_final: null, cartao_bandeira: null })
      .eq("restaurante_id", restauranteId);
  }

  const acessoNovo = await estenderAcesso(
    restauranteId,
    plano,
    "pix",
    anualAntigo ? ANUAL_ANTIGO.dias : PLANOS.mensal.dias
  );
  await emailPagamentoConfirmado(restauranteId, String(order.id), acessoNovo).catch(() => {});
}

// ---------------------------------------------------------------------
// Cancelamento de verdade na Pagar.me
// ---------------------------------------------------------------------

/**
 * Cancela a assinatura no cartão na Pagar.me e confere na própria
 * Pagar.me que ficou "canceled" (sem cobranças futuras nem faturas
 * pendentes). Lança erro se não conseguir confirmar.
 */
export async function cancelarAssinaturaPagarme(subscriptionId: string) {
  let erroCancelar: unknown = null;

  try {
    await pagarme(`/subscriptions/${subscriptionId}`, {
      method: "DELETE",
      body: { cancel_pending_invoices: true },
    });
  } catch (e) {
    // Pode já estar cancelada: a conferência abaixo decide.
    erroCancelar = e;
  }

  let conferida: any;
  try {
    conferida = await pagarme<any>(`/subscriptions/${subscriptionId}`);
  } catch (e) {
    // Não existe mais na Pagar.me: não há o que cobrar.
    if (e instanceof PagarmeError && e.status === 404) return { status: "canceled" };
    throw e;
  }

  if (conferida?.status !== "canceled") {
    console.error("[assinatura] cancelamento não confirmado", subscriptionId, conferida?.status, erroCancelar);
    throw new Error("A Pagar.me não confirmou o cancelamento.");
  }

  return conferida;
}

// ---------------------------------------------------------------------
// Conferência direto na Pagar.me (reserva caso o aviso automático, o
// webhook, falhe ou atrase). Cada pagamento continua contando 1 vez só.
// ---------------------------------------------------------------------

const ultimaConferencia = new Map<string, number>();

export async function conferirPagamentos(
  restauranteId: string,
  opcoes: { intervaloMs?: number } = {}
) {
  const intervalo = opcoes.intervaloMs ?? 15_000;
  const ultima = ultimaConferencia.get(restauranteId) ?? 0;
  if (Date.now() - ultima < intervalo) return;
  ultimaConferencia.set(restauranteId, Date.now());
  if (ultimaConferencia.size > 2000) ultimaConferencia.delete(ultimaConferencia.keys().next().value as string);

  // 1. Pix do plano gerados nos últimos 2 dias e ainda não confirmados
  const { data: pendentes } = await supabaseAdmin
    .from("pagamentos_assinatura")
    .select("pagarme_order_id")
    .eq("restaurante_id", restauranteId)
    .eq("status", "pending")
    .not("pagarme_order_id", "is", null)
    .gte("created_at", new Date(Date.now() - 2 * DIA_MS).toISOString())
    .order("created_at", { ascending: false })
    .limit(5);

  for (const p of pendentes ?? []) {
    try {
      const order = await pagarme<any>(`/orders/${p.pagarme_order_id}`);
      if (order?.status === "paid") await confirmarPixAssinatura(order);
    } catch (e) {
      console.error("[assinatura] conferir Pix", e);
    }
  }

  // 2. Assinatura no cartão: faturas pagas que ainda não contaram
  const linha = await getLinhaAssinatura(restauranteId);
  if (linha.metodo !== "cartao" || !linha.pagarme_subscription_id) return;

  try {
    const faturas = await pagarme<any>(`/invoices?subscription_id=${linha.pagarme_subscription_id}&size=5`);
    for (const fatura of faturas?.data ?? []) {
      if (fatura?.status === "paid") await sincronizarFaturaCartao(fatura.id);
    }
    await sincronizarAssinaturaCartao(linha.pagarme_subscription_id);
  } catch (e) {
    console.error("[assinatura] conferir cartão", e);
  }
}
