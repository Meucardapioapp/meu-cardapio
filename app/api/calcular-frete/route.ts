import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const { restauranteId, bairro } = await req.json();

    console.log("RESTAURANTE:", restauranteId);
    console.log("BAIRRO:", bairro);

    const { data: bairroEntrega, error } = await supabaseAdmin
      .from("bairros_entrega")
      .select("*")
      .eq("restaurante_id", restauranteId)
      .eq("bairro", bairro)
      .single();

    console.log("BAIRRO ENCONTRADO:", bairroEntrega);

    if (error || !bairroEntrega) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Este bairro não é atendido.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      sucesso: true,
      faixaFrete: {
        valor: Number(bairroEntrega.valor),
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        sucesso: false,
        erro: "Erro ao calcular frete.",
      },
      { status: 500 }
    );
  }
}