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
  complemento,
  referencia,
  observacoes,
  itens,
  subtotal,
  taxaEntrega,
  taxaOperacional,
  total,
  totalPago,
  payment_method,
} = body;

console.log("BODY RECEBIDO:");
console.dir(body, { depth: null });

console.log("ITENS RECEBIDOS:");
console.dir(itens, { depth: null });

console.log("================================");
console.log("CRIANDO PEDIDO");
console.log("subtotal:", subtotal);
console.log("taxaEntrega:", taxaEntrega);
console.log("total:", total);
console.log("================================");

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
complemento,
referencia,

observacoes,

itens,

subtotal,

taxa_entrega: taxaEntrega,

taxa_operacional: taxaOperacional,

total,

total_pago: totalPago,

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