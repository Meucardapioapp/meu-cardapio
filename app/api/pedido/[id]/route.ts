import { limitar } from "@/lib/server/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { pedidoPublico } from "@/lib/server/pedido";

/**
 * Detalhe do pedido na área do cliente.
 * Exige o código do pedido (?c=) — sem ele não há como listar pedidos alheios.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    if (!(await limitar(request, "pedido-ver", 60, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }

  const { id } = await params;
  const codigo = request.nextUrl.searchParams.get("c");

  if (!id || !codigo) {
    return NextResponse.json(
      { success: false, error: "Pedido não informado." },
      { status: 400 }
    );
  }

  const { data: pedido } = await supabaseAdmin
    .from("pedidos")
    .select("*")
    .eq("id", id)
    .eq("codigo_acesso", codigo)
    .maybeSingle();

  if (!pedido) {
    return NextResponse.json(
      { success: false, error: "Pedido não encontrado." },
      { status: 404 }
    );
  }

  const publico = pedidoPublico(pedido);

  return NextResponse.json({
    success: true,
    pedido: publico,
    cliente: { nome: publico.nome },
    endereco: pedido.tipo_pedido === "retirada"
      ? null
      : {
          rua: pedido.rua,
          numero: pedido.numero,
          bairro: pedido.bairro,
          complemento: pedido.complemento,
          referencia: pedido.referencia,
        },
    itens: publico.itens,
  });
}
