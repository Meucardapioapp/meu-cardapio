import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const restauranteId =
      req.nextUrl.searchParams.get("restauranteId");

    if (!restauranteId) {
      return NextResponse.json(
        { error: "Restaurante não informado" },
        { status: 400 }
      );
    }

    const { data, error } =
      await supabaseAdmin
        .from("configuracoes_pagamento")
        .select("dinheiro, cartao_entrega")
        .eq("restaurante_id", restauranteId)
        .single();

    if (error) {
      return NextResponse.json({
        dinheiro: false,
      });
    }

return NextResponse.json({
  dinheiro: data?.dinheiro ?? false,
  cartao_entrega: data?.cartao_entrega ?? false,
});

  } catch (error) {
    console.error(error);

return NextResponse.json({
  dinheiro: false,
  cartao_entrega: false,
});

  }
}