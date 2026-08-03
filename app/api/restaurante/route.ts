import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const restauranteId = req.nextUrl.searchParams.get("restauranteId");

    if (!restauranteId) {
      return NextResponse.json(
        {
          success: false,
          error: "Restaurante não informado",
        },
        { status: 400 }
      );
    }

    const { data: restaurante, error } = await supabaseAdmin
      .from("restaurantes")
      .select(
        `
        cpf_cnpj,
        banco,
        agencia,
        conta,
        tipo_conta,
        pagarme_recipient_id
        `
      )
      .eq("id", restauranteId)
      .single();

    if (error || !restaurante) {
      return NextResponse.json(
        {
          success: false,
          error: "Restaurante não encontrado",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      restaurante,
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}