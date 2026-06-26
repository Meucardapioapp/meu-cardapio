import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      restauranteId,
      nome,
      telefone,
      endereco,
      bairro,
      rua,
      numero,
      observacoes,
      itens,
      subtotal,
      taxaEntrega,
      total,
      payment_method,
    } = body;

    const { data, error } =
      await supabaseAdmin
        .from("pedidos")
        .insert({
          restaurante_id: restauranteId,

          cliente: nome,
          nome,

          telefone,

          endereco,

          bairro,
          rua,
          numero,

          observacoes,

          itens,

          total,

          payment_method,

          payment_status: "pending",

          status: "pendente",
        })
        .select()
        .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      pedido: data,
    });

  } catch (error: any) {

    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}