import { limitar } from "@/lib/server/rate-limit";
import { lancarPedidoDoQr } from "@/lib/server/salao";
import { NextRequest, NextResponse } from "next/server";
import { avisarNovoPedido } from "@/lib/server/notificacoes";
import { timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { pagarme } from "@/lib/server/pagarme";
import { contabilizarPedido } from "@/lib/server/fidelidade";
import {
  confirmarPixAssinatura,
  sincronizarAssinaturaCartao,
  sincronizarFaturaCartao,
} from "@/lib/server/assinatura";

/**
 * Webhook da Pagar.me.
 *
 * Segurança em duas camadas:
 * 1. Se PAGARME_WEBHOOK_USER/PASSWORD estiverem configurados, exige
 *    o mesmo usuário e senha (Basic Auth) cadastrados no painel da Pagar.me.
 * 2. Nunca confia no conteúdo do evento: busca o pedido, a fatura ou a
 *    assinatura direto na API da Pagar.me antes de mudar qualquer coisa.
 */

function autenticado(req: NextRequest) {
  const usuario = process.env.PAGARME_WEBHOOK_USER;
  const senha = process.env.PAGARME_WEBHOOK_PASSWORD;

  if (!usuario || !senha) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[webhook] PAGARME_WEBHOOK_USER/PASSWORD não configurados: configure na Vercel e na Pagar.me.");
    }
    return true;
  }

  const header = req.headers.get("authorization") || "";
  const esperado = "Basic " + Buffer.from(`${usuario}:${senha}`).toString("base64");

  const a = Buffer.from(header);
  const b = Buffer.from(esperado);

  return a.length === b.length && timingSafeEqual(a, b);
}

async function processarPedido(orderId: string) {
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

  const status: string = order?.status;

  if (status === "paid") {
    const pagoCentavos = Number(order?.amount ?? 0);
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

async function processarTransferencia(transferId: string) {
  const transferencia = await pagarme<any>(`/transfers/${transferId}`);

  if (!transferencia?.status) return;

  await supabaseAdmin
    .from("saques")
    .update({ status: transferencia.status })
    .eq("pagarme_withdrawal_id", transferId);
}

export async function POST(req: NextRequest) {
    if (!(await limitar(req, "webhook-pagarme", 300, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }

  if (!autenticado(req)) {
    return NextResponse.json({ received: false }, { status: 401 });
  }

  try {
    const body = await req.json();
    const tipo: string = body?.type ?? "";
    const data = body?.data ?? {};

    if (tipo.startsWith("order.") || tipo.startsWith("charge.")) {
      const orderId: string | undefined = tipo.startsWith("order.") ? data?.id : data?.order?.id;
      if (orderId) await processarPedido(orderId);
    } else if (tipo.startsWith("invoice.")) {
      if (data?.id) await sincronizarFaturaCartao(data.id);
    } else if (tipo.startsWith("subscription.")) {
      if (data?.id) await sincronizarAssinaturaCartao(data.id);
    } else if (tipo.startsWith("transfer.")) {
      const transferId = data?.id ?? data?.transfer?.id;
      if (transferId) await processarTransferencia(transferId);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[webhook]", error?.message ?? error);
    // 500 faz a Pagar.me tentar de novo mais tarde.
    return NextResponse.json({ received: false }, { status: 500 });
  }
}
