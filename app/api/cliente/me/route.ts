import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { tokenDoCliente } from "@/lib/server/cliente-token";
import { limitar } from "@/lib/server/rate-limit";
import { descriptografar } from "@/lib/server/cripto";

/** Dados da conta do cliente final (exige o token salvo no aparelho). */
export async function GET(req: NextRequest) {
  try {
    if (!(await limitar(req, "cliente-me", 60, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas." }, { status: 429 });
    }

    const token = tokenDoCliente(req);

    if (!token) {
      return NextResponse.json({ success: false, error: "Token não informado" }, { status: 400 });
    }

    const { data: cliente } = await supabaseAdmin
      .from("clientes")
      .select("id, nome, telefone, email, cpf, restaurante_id, total_pedidos, total_gasto, ultimo_pedido, token_acesso")
      .eq("token_acesso", token)
      .maybeSingle();

    if (!cliente) {
      return NextResponse.json({ success: false, error: "Cliente não encontrado" }, { status: 404 });
    }

    const [{ data: enderecos }, { data: pedidos }, { data: fidelidade }] = await Promise.all([
      supabaseAdmin.from("enderecos_cliente").select("*").eq("cliente_id", cliente.id),
      supabaseAdmin
        .from("pedidos")
        .select("id, numero_pedido, codigo_acesso, status, created_at, total, total_pago, payment_method, payment_status, tipo_pedido, itens")
        .eq("cliente_id", cliente.id)
        .eq("confirmado", true)
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("cliente_fidelidade")
        .select("selos, desconto_disponivel, ultimo_resgate, restaurante_id")
        .eq("cliente_id", cliente.id)
        .eq("restaurante_id", cliente.restaurante_id)
        .maybeSingle(),
    ]);

    return NextResponse.json({
      success: true,
      // CPF fica criptografado no banco; o próprio cliente vê só o dele.
      cliente: { ...cliente, cpf: descriptografar(cliente.cpf) },
      enderecos: enderecos ?? [],
      pedidos: pedidos ?? [],
      fidelidade: fidelidade ?? null,
    });
  } catch (error) {
    console.error("[cliente/me]", error);
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 });
  }
}
