import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { success: false, error: "Token não informado" },
      { status: 400 }
    );
  }

  const { data: cliente, error } = await supabaseAdmin
    .from("clientes")
    .select("*")
    .eq("token_acesso", token)
    .single();

  if (error || !cliente) {
    return NextResponse.json(
      { success: false, error: "Cliente não encontrado" },
      { status: 404 }
    );
  }

  const { data: enderecos } = await supabaseAdmin
    .from("enderecos_cliente")
    .select("*")
    .eq("cliente_id", cliente.id);

 const { data: pedidos } = await supabaseAdmin
  .from("pedidos")
  .select("*")
  .eq("cliente_id", cliente.id)
  .eq("confirmado", true)
  .order("created_at", { ascending: false });

  return NextResponse.json({
    success: true,
    cliente,
    enderecos,
    pedidos,
  });
}