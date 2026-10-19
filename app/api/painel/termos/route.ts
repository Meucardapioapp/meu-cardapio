import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno, getDonoAutenticado, naoAutenticado } from "@/lib/server/auth";
import { limitar } from "@/lib/server/rate-limit";

/** O dono aceita a versão atual dos Termos de Uso e da Política de Privacidade. */
export async function POST(req: NextRequest) {
  try {
    if (!(await limitar(req, "painel-termos", 10, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas." }, { status: 429 });
    }
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();
    const { error } = await supabaseAdmin
      .from("restaurantes")
      .update({ termos_aceitos_em: new Date().toISOString() })
      .eq("id", dono.restaurante.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return erroInterno("painel/termos", error);
  }
}
