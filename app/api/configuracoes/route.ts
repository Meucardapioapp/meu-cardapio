import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function PUT(req: Request) {
  try {
    const {
      restauranteId,
      nome,
      whatsapp,
    } = await req.json();

    const { error } = await supabaseAdmin
      .from("restaurantes")
      .update({
        nome_responsavel: nome,
        whatsapp,
      })
      .eq("id", restauranteId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
    });

  } catch (err) {
    return NextResponse.json(
      {
        error: "Erro ao salvar configurações",
      },
      {
        status: 500,
      }
    );
  }
}