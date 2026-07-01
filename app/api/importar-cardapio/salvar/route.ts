import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const categorias = body.categorias ?? [];

    for (const categoria of categorias) {
      await supabaseAdmin.from("categorias").insert({
        nome: categoria.nome,
      });
    }

    return NextResponse.json({
      success: true,
    });

  } catch (e) {
    console.error(e);

    return NextResponse.json({
      success: false,
      message: "Erro ao salvar categorias",
    });
  }
}