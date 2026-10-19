import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { avisoForaDoAr, avisoPlanoVencendo } from "@/lib/server/notificacoes";
import { conferirPagamentos } from "@/lib/server/assinatura";

/**
 * Roda 1x por dia (vercel.json): avisa quem está com o plano vencendo
 * (3 dias e 1 dia antes) e quem saiu do ar. Cada aviso vai uma vez só.
 * A Vercel envia "Authorization: Bearer CRON_SECRET".
 */
export const maxDuration = 60;

const DIA = 86400000;

function autorizado(req: NextRequest) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) return false;
  const a = Buffer.from(req.headers.get("authorization") ?? "");
  const b = Buffer.from(`Bearer ${segredo}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const agora = Date.now();
  const { data, error } = await supabaseAdmin
    .from("assinaturas")
    .select("restaurante_id, status, metodo, acesso_ate")
    .gte("acesso_ate", new Date(agora - 3 * DIA).toISOString())
    .lte("acesso_ate", new Date(agora + 4 * DIA).toISOString())
    .limit(2000);

  if (error) {
    console.error("[cron/avisos]", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  let vencendo = 0;
  let foraDoAr = 0;

  // Cartão perto de renovar: confere na Pagar.me antes de avisar ou tirar do ar
  // (caso o aviso automático da cobrança tenha falhado).
  for (const a of data ?? []) {
    if (a.metodo === "cartao") {
      await conferirPagamentos(String(a.restaurante_id), { intervaloMs: 0 }).catch(() => {});
    }
  }

  const { data: atualizadas } = await supabaseAdmin
    .from("assinaturas")
    .select("restaurante_id, status, metodo, acesso_ate")
    .in("restaurante_id", (data ?? []).map((a) => a.restaurante_id));
  const porId = new Map((atualizadas ?? []).map((a) => [String(a.restaurante_id), a]));

  for (const original of data ?? []) {
    const a = porId.get(String(original.restaurante_id)) ?? original;
    const restante = new Date(a.acesso_ate).getTime() - agora;
    // Cartão ativo renova sozinho: não precisa de aviso de vencimento.
    const renovaSozinho = a.status === "ativa" && a.metodo === "cartao";

    if (restante <= 0) {
      await avisoForaDoAr(String(a.restaurante_id), a.acesso_ate);
      foraDoAr++;
    } else if (!renovaSozinho && a.status !== "cancelada") {
      const dias = Math.ceil(restante / DIA);
      if (dias === 3 || dias === 1) {
        await avisoPlanoVencendo(String(a.restaurante_id), a.acesso_ate, dias);
        vencendo++;
      }
    }
  }

  return NextResponse.json({ ok: true, vencendo, foraDoAr });
}
