import { limitar } from "@/lib/server/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno, getDonoAutenticado, naoAutenticado } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  const dono = await getDonoAutenticado(req);
  if (!dono) return naoAutenticado();

  return NextResponse.json({
    nome_responsavel: dono.restaurante.nome_responsavel,
    nome_restaurante: dono.restaurante.nome_restaurante,
    email: dono.restaurante.email,
    whatsapp: dono.restaurante.whatsapp,
  });
}

export async function PUT(req: NextRequest) {
  try {
    if (!(await limitar(req, "painel-escrita", 60, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }

    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    const { nome, whatsapp } = await req.json();

    const { error } = await supabaseAdmin
      .from("restaurantes")
      .update({
        nome_responsavel: String(nome ?? "").trim().slice(0, 120),
        whatsapp: String(whatsapp ?? "").trim().slice(0, 30),
      })
      .eq("id", dono.restaurante.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return erroInterno("configuracoes", error);
  }
}
