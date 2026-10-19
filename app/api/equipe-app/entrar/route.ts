import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno } from "@/lib/server/auth";
import { limitar, limitarChave } from "@/lib/server/rate-limit";
import { FUNCOES, PAGINA_FUNCAO, gravarSessao, normalizarTelefone, pinConfere, type Funcao } from "@/lib/server/funcionario";

/** Entrada da equipe (garçom, cozinha, motoboy): celular + PIN. */
export async function POST(req: NextRequest) {
  try {
    const muitas = NextResponse.json(
      { success: false, error: "Muitas tentativas. Espere 15 minutos e tente de novo." },
      { status: 429 }
    );
    if (!(await limitar(req, "equipe-entrar", 20, 900))) return muitas;

    const body = await req.json().catch(() => ({}));
    const telefone = normalizarTelefone(body?.telefone);
    const pin = String(body?.pin ?? "").replace(/\D/g, "");

    if (!telefone || pin.length !== 4) {
      return NextResponse.json({ success: false, error: "Digite o celular com DDD e o PIN de 4 números." }, { status: 400 });
    }

    // PIN tem 4 números: limite por celular em 15 min E por dia (adivinhar levaria anos).
    if (!(await limitarChave("equipe-entrar-tel", telefone, 8, 900))) return muitas;
    if (!(await limitarChave("equipe-entrar-tel-dia", telefone, 20, 86400))) {
      return NextResponse.json(
        { success: false, error: "Muitas tentativas hoje com este celular. Peça um PIN novo ao restaurante." },
        { status: 429 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("funcionarios")
      .select("id, pin_hash, sessao_versao, funcao")
      .eq("telefone", telefone)
      .eq("ativo", true)
      .limit(10);

    if (error) throw error;

    const certos = (data ?? []).filter((m) => pinConfere(String(m.id), pin, m.pin_hash));

    if (!certos.length) {
      return NextResponse.json({ success: false, error: "Celular ou PIN incorreto." }, { status: 401 });
    }

    await supabaseAdmin
      .from("funcionarios")
      .update({ ultimo_acesso: new Date().toISOString() })
      .in("id", certos.map((m) => m.id));

    const funcoes = [...new Set(certos.map((m) => m.funcao))].filter((f): f is Funcao => FUNCOES.includes(f));
    const res = NextResponse.json({ success: true, funcoes, pagina: PAGINA_FUNCAO[funcoes[0] ?? "motoboy"] });
    gravarSessao(res, certos.map((m) => ({ id: String(m.id), sessao_versao: m.sessao_versao })));
    return res;
  } catch (error) {
    return erroInterno("equipe-app/entrar", error);
  }
}
