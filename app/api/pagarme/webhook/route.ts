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
 * Webhook da Pagar.me (API v5).
 *
 * A Pagar.me v5 não assina os avisos com HMAC: a autenticação oficial é o
 * usuário e senha (Basic Auth) cadastrados no webhook do painel da Pagar.me.
 *
 * Segurança em camadas:
 * 1. Limite de tentativas por IP.
 * 2. Usuário e senha conferidos ANTES de ler o corpo (comparação em tempo
 *    constante). Sem senha certa: 401. Em produção, sem a senha configurada
 *    na Vercel, recusa tudo (nunca aceita aviso sem autenticação).
 * 3. Corpo inválido ou com IDs fora do formato da Pagar.me: 400.
 * 4. Nunca confia no conteúdo do aviso: busca o pedido, a fatura, a
 *    assinatura ou o saque direto na API da Pagar.me (com a chave secreta)
 *    e só então muda alguma coisa. Um aviso falso ou adulterado não aprova
 *    nada, porque o que vale é o que a Pagar.me responde.
 */

const ID = {
  order: /^or_[A-Za-z0-9]{8,64}$/,
  invoice: /^in_[A-Za-z0-9]{8,64}$/,
  subscription: /^sub_[A-Za-z0-9]{8,64}$/,
  transfer: /^(tran|tr)_[A-Za-z0-9]{8,64}$/,
};

function comparar(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  // timingSafeEqual exige o mesmo tamanho; compara consigo mesmo para gastar o mesmo tempo.
  if (x.length !== y.length) {
    timingSafeEqual(y, y);
    return false;
  }
  return timingSafeEqual(x, y);
}

function autenticado(req: NextRequest): "ok" | "sem-config" | "negado" {
  const usuario = process.env.PAGARME_WEBHOOK_USER;
  const senha = process.env.PAGARME_WEBHOOK_PASSWORD;

  if (!usuario || !senha) {
    // Só em desenvolvimento local aceita sem senha.
    return process.env.NODE_ENV === "production" ? "sem-config" : "ok";
  }

  const header = req.headers.get("authorization") || "";
  const esperado = "Basic " + Buffer.from(`${usuario}:${senha}`).toString("base64");
  return comparar(header, esperado) ? "ok" : "negado";
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

  const auth = autenticado(req);
  if (auth !== "ok") {
    console.warn(
      auth === "sem-config"
        ? "[webhook] recusado: configure PAGARME_WEBHOOK_USER e PAGARME_WEBHOOK_PASSWORD na Vercel e no webhook da Pagar.me"
        : "[webhook] recusado: usuário/senha do webhook inválidos"
    );
    return NextResponse.json({ received: false }, { status: 401 });
  }

  // Só lê o corpo depois de autenticar.
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ received: false, error: "Corpo inválido." }, { status: 400 });
  }

  const tipo = typeof body?.type === "string" ? body.type : "";
  const data = body?.data && typeof body.data === "object" ? body.data : null;
  if (!tipo || !data) {
    return NextResponse.json({ received: false, error: "Evento inválido." }, { status: 400 });
  }

  // ID do recurso no formato da Pagar.me (impede montar caminhos estranhos na API).
  let alvo: { tipo: keyof typeof ID; id: string } | null = null;
  if (tipo.startsWith("order.")) alvo = { tipo: "order", id: String(data.id ?? "") };
  else if (tipo.startsWith("charge.")) alvo = { tipo: "order", id: String(data.order?.id ?? "") };
  else if (tipo.startsWith("invoice.")) alvo = { tipo: "invoice", id: String(data.id ?? "") };
  else if (tipo.startsWith("subscription.")) alvo = { tipo: "subscription", id: String(data.id ?? "") };
  else if (tipo.startsWith("transfer.")) alvo = { tipo: "transfer", id: String(data.id ?? data.transfer?.id ?? "") };

  // Evento que não usamos: confirma para a Pagar.me não reenviar.
  if (!alvo) return NextResponse.json({ received: true });

  if (!ID[alvo.tipo].test(alvo.id)) {
    console.warn("[webhook] ID fora do formato", tipo);
    return NextResponse.json({ received: false, error: "ID inválido." }, { status: 400 });
  }

  try {
    if (alvo.tipo === "order") await confirmarPedidoPagarme(alvo.id);
    else if (alvo.tipo === "invoice") await sincronizarFaturaCartao(alvo.id);
    else if (alvo.tipo === "subscription") await sincronizarAssinaturaCartao(alvo.id);
    else if (alvo.tipo === "transfer") await processarTransferencia(alvo.id);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[webhook]", error?.message ?? error);
    // 500 faz a Pagar.me tentar de novo mais tarde.
    return NextResponse.json({ received: false }, { status: 500 });
  }
}
