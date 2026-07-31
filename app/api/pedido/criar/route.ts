import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

const {
  restauranteId,
  nome,
  telefone,
  cpf,
  tipoPedido,
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

const {
  data: ultimoPedido,
  error: erroUltimo,
} = await supabaseAdmin
  .from("pedidos")
  .select("numero_pedido")
  .eq("restaurante_id", restauranteId)
  .not("numero_pedido", "is", null)
  .order("numero_pedido", {
    ascending: false,
  })
  .limit(1)
  .maybeSingle();

if (erroUltimo) {
  throw erroUltimo;
}

const numeroPedido =
  (ultimoPedido?.numero_pedido ?? 0) + 1;


// Procurar cliente pelo telefone e restaurante
let { data: cliente } = await supabaseAdmin
  .from("clientes")
  .select("*")
  .eq("telefone", telefone)
  .eq("restaurante_id", restauranteId)
  .maybeSingle();

if (!cliente) {
  const { data: novoCliente, error: erroCliente } =
    await supabaseAdmin
      .from("clientes")
      .insert({
        restaurante_id: restauranteId,
        nome,
        telefone,
        email: null,
        cpf,
        total_pedidos: 0,
        total_gasto: 0,
        ultimo_acesso: new Date(),
      })
      .select()
      .single();

  if (erroCliente) throw erroCliente;

  cliente = novoCliente;
}


const { data, error } =
      await supabaseAdmin
        .from("pedidos")
.insert({
  restaurante_id: restauranteId,
cliente_id: cliente.id,
  numero_pedido: numeroPedido,

  cliente: nome,
          nome,

 telefone,

cpf,

tipo_pedido: tipoPedido,

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

    await supabaseAdmin
  .from("clientes")
  .update({
    total_pedidos: (cliente.total_pedidos ?? 0) + 1,
    total_gasto: (cliente.total_gasto ?? 0) + Number(totalPago),
    ultimo_pedido: new Date(),
    ultimo_acesso: new Date(),
  })
  .eq("id", cliente.id);


  const { data: enderecoExistente } = await supabaseAdmin
  .from("enderecos_cliente")
  .select("id")
  .eq("cliente_id", cliente.id)
  .eq("principal", true)
  .maybeSingle();

if (!enderecoExistente) {
  await supabaseAdmin
    .from("enderecos_cliente")
    .insert({
      cliente_id: cliente.id,
      apelido: "Casa",
      cep: endereco?.cep ?? null,
      rua,
      numero,
      bairro,
      cidade: endereco?.cidade ?? null,
      estado: endereco?.estado ?? null,
      complemento,
      referencia,
      principal: true,
    });
} else {
  await supabaseAdmin
    .from("enderecos_cliente")
    .update({
      cep: endereco?.cep ?? null,
      rua,
      numero,
      bairro,
      cidade: endereco?.cidade ?? null,
      estado: endereco?.estado ?? null,
      complemento,
      referencia,
    })
    .eq("id", enderecoExistente.id);
}

console.log("CLIENTE ENCONTRADO:");
console.dir(cliente, { depth: null });

return NextResponse.json({
  success: true,
  pedido: data,
  cliente: {
    id: cliente.id,
    token_acesso: cliente.token_acesso,
  },
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