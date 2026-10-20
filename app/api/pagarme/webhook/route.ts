import { limitar } from "@/lib/server/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { pagarme } from "@/lib/server/pagarme";
import { confirmarPedidoPagarme } from "@/lib/server/pix-confirmacao";
import {
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
      if (orderId) await confirmarPedidoPagarme(orderId);
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
