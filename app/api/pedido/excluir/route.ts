import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function DELETE(req: NextRequest) {
  try {
    const { pedidoId, restauranteId } = await req.json();

    if (!pedidoId || !restauranteId) {
      return NextResponse.json(
        { error: "Dados do pedido não informados" },
        { status: 400 }
      );
    }

    const { data: pedido, error: buscaError } = await supabaseAdmin
      .from("pedidos")
      .select("id")
      .eq("id", pedidoId)
      .eq("restaurante_id", restauranteId)
      .single();

    if (buscaError || !pedido) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabaseAdmin
      .from("pedidos")
      .delete()
      .eq("id", pedidoId)
      .eq("restaurante_id", restauranteId);

    if (deleteError) {
      console.error("Erro ao excluir pedido:", deleteError);

      return NextResponse.json(
        { error: "Não foi possível excluir o pedido" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Pedido excluído com sucesso",
    });
  } catch (error) {
    console.error("Erro interno ao excluir pedido:", error);

    return NextResponse.json(
      { error: "Erro interno ao excluir pedido" },
      { status: 500 }
    );
  }
}