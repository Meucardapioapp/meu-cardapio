import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const { telefone, slug } = await req.json();

    if (!telefone) {
      return NextResponse.json({
        success: false,
        error: "Telefone não informado.",
      });
    }

    if (!slug) {
      return NextResponse.json({
        success: false,
        error: "Restaurante não informado.",
      });
    }

    const telefoneLimpo = telefone;

    // Buscar o restaurante pelo slug
    const {
      data: restaurante,
      error: restauranteError,
    } = await supabaseAdmin
      .from("restaurantes")
      .select("id")
      .eq("slug", slug)
      .single();

    if (restauranteError || !restaurante) {
      return NextResponse.json({
        success: false,
        error: "Restaurante não encontrado.",
      });
    }

    // Buscar o cliente pelo telefone + restaurante
    const {
      data: cliente,
      error,
    } = await supabaseAdmin
      .from("clientes")
      .select("*")
      .eq("telefone", telefoneLimpo)
      .eq("restaurante_id", restaurante.id)
      .single();

    if (error || !cliente) {
      return NextResponse.json({
        success: false,
        error: "Nenhuma conta encontrada para este telefone.",
      });
    }

    return NextResponse.json({
      success: true,
      cliente,
      token: cliente.token_acesso,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
    });
  }
}