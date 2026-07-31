import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID do pedido não informado.",
        },
        {
          status: 400,
        }
      );
    }

    const { data: pedido, error: pedidoError } =
      await supabaseAdmin
        .from("pedidos")
        .select("*")
        .eq("id", id)
        .single();

    if (pedidoError || !pedido) {
      return NextResponse.json(
        {
          success: false,
          error: "Pedido não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    let cliente = null;

    if (pedido.cliente_id) {
      const { data } = await supabaseAdmin
        .from("clientes")
        .select("*")
        .eq("id", pedido.cliente_id)
        .single();

      cliente = data;
    }

    let endereco = null;

if (cliente) {
  const { data } = await supabaseAdmin
    .from("enderecos_cliente")
    .select("*")
    .eq("cliente_id", cliente.id)
    .order("id", { ascending: true })
    .limit(1)
    .single();

  endereco = data;
}

const itens = Array.isArray(pedido.itens)
  ? pedido.itens
  : [];

return NextResponse.json({
  success: true,

  pedido: {
    id: pedido.id,
    numero_pedido: pedido.numero_pedido,
    status: pedido.status,
    created_at: pedido.created_at,

    subtotal: pedido.subtotal,
    taxa_entrega: pedido.taxa_entrega,
    taxa_operacional: pedido.taxa_operacional,
    total: pedido.total,
    total_pago: pedido.total_pago,

    payment_method: pedido.payment_method,
    payment_status: pedido.payment_status,

    observacoes: pedido.observacoes,

    referencia: pedido.referencia,
    complemento: pedido.complemento,

    retirada_no_local: pedido.retirada_no_local,

    tipo_pedido: pedido.tipo_pedido,
 
},

  cliente,

  endereco,

  itens,
  
});

  } catch (error) {
    console.error("Erro ao buscar pedido:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor.",
      },
      {
        status: 500,
      }
    );
  }
}