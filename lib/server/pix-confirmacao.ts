import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { pagarme } from "@/lib/server/pagarme";
import { contabilizarPedido } from "@/lib/server/fidelidade";
import { lancarPedidoDoQr } from "@/lib/server/salao";
import { avisarNovoPedido } from "@/lib/server/notificacoes";
import { confirmarPixAssinatura } from "@/lib/server/assinatura";

/**
 * Confere um pedido direto na Pagar.me e, se estiver pago, aprova no banco.
 * Usado pelo webhook e também pela tela do Pix (se o webhook atrasar ou
 * falhar, o cliente não fica preso em "aguardando pagamento").
 * Nunca confia em dado vindo do navegador: a fonte é a API da Pagar.me.
 */
export async function confirmarPedidoPagarme(orderId: string) {
  // Fonte da verdade: a própria Pagar.me.
  const order = await pagarme<any>(`/orders/${orderId}`);

  if (order?.metadata?.tipo === "assinatura") {
    await confirmarPixAssinatura(order);
    return;
  }

  const { data: pedido } = await supabaseAdmin
    .from("pedidos")
    .select("id, total, payment_method, payment_status, pushcut_pix_enviado, cliente_id, restaurante_id, desconto_fidelidade")
    .eq("pagarme_order_id", orderId)
    .maybeSingle();

  if (!pedido) return;

  // O pedido da Pagar.me tem que ser deste pedido (gravado por nós ao gerar o Pix).
  const pedidoDoPix = order?.metadata?.pedido_id;
  if (pedidoDoPix != null && String(pedidoDoPix) !== String(pedido.id)) {
    console.warn("[pix] pedido da Pagar.me não bate com o pedido do banco", pedido.id);
    return;
  }

  const status: string = order?.status;

  if (status === "paid") {
    // Valor que entrou de fato (cobranças pagas); se a Pagar.me não informar, usa o total do pedido.
    const cobrancasPagas = (order?.charges ?? []).filter((c: any) => c?.status === "paid");
    const pagoCentavos = cobrancasPagas.length
      ? cobrancasPagas.reduce((t: number, c: any) => t + Number(c?.paid_amount ?? c?.amount ?? 0), 0)
      : Number(order?.amount ?? 0);
    const esperadoCentavos = Math.round(Number(pedido.total) * 100);

    if (pagoCentavos < esperadoCentavos) {
      console.warn("[webhook] valor pago menor que o pedido", pedido.id);
      return;
    }

    // Só o primeiro evento "pago" faz efeito (evita selo em dobro).
    const { data: atualizado } = await supabaseAdmin
      .from("pedidos")
      .update({
        // Fica "pendente" para o restaurante aceitar no painel (toca o alerta).
        payment_status: "approved",
        confirmado: true,
      })
      .eq("id", pedido.id)
      .neq("payment_status", "approved")
      .select("id")
      .maybeSingle();

    if (!atualizado) return;

    // Histórico do cliente, selo de fidelidade e uso do cupom.
    await contabilizarPedido(pedido.id, true, { pedidoNovo: true });
    // Pix pago pelo QR Code da mesa: entra na comanda como valor já pago.
    await lancarPedidoDoQr(pedido.id);

    await Promise.all([notificarVendaPix(pedido), avisarNovoPedido(pedido.id).catch(() => {})]);
    return;
  }

  if (status === "failed" || status === "canceled") {
    await supabaseAdmin
      .from("pedidos")
      .update({ payment_status: "failed", status: "recusado" })
      .eq("id", pedido.id)
      .neq("payment_status", "approved");
  }
}

async function notificarVendaPix(pedido: { id: string; total: number }) {
  const url = process.env.PUSHCUT_NOVA_VENDA_PIX_URL;
  if (!url) return;

  const { data: reservado } = await supabaseAdmin
    .from("pedidos")
    .update({ pushcut_pix_enviado: true })
    .eq("id", pedido.id)
    .eq("pushcut_pix_enviado", false)
    .select("id")
    .maybeSingle();

  if (!reservado) return;

  const comissao = (Number(pedido.total ?? 0) * 0.01).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  try {
    const resposta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `Pix - R$ ${comissao}`, text: `Pix - R$ ${comissao}` }),
    });

    if (!resposta.ok) throw new Error(`Pushcut ${resposta.status}`);
  } catch (e) {
    console.error("[webhook] pushcut", e);
    await supabaseAdmin.from("pedidos").update({ pushcut_pix_enviado: false }).eq("id", pedido.id);
  }
}

