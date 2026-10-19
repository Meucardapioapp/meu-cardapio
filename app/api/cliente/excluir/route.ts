import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { limitar } from "@/lib/server/rate-limit";
import { tokenDoCliente } from "@/lib/server/cliente-token";

/**
 * Direito de exclusão (LGPD, art. 18): o cliente final apaga a própria conta.
 * Apaga cadastro, endereços e fidelidade. Os pedidos continuam no restaurante
 * (registro de venda), mas sem nome, telefone nem endereço.
 */
export async function POST(req: Request) {
  try {
    if (!(await limitar(req, "cliente-excluir", 5, 3600))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    if (body?.confirmar !== "APAGAR") {
      return NextResponse.json({ success: false, error: "Confirme digitando APAGAR." }, { status: 400 });
    }

    const token = tokenDoCliente(req);
    if (!token) return NextResponse.json({ success: false, error: "Entre na sua conta primeiro." }, { status: 401 });

    const { data: cliente } = await supabaseAdmin.from("clientes").select("id").eq("token_acesso", token).maybeSingle();
    if (!cliente) return NextResponse.json({ success: false, error: "Conta não encontrada." }, { status: 404 });

    // Pedidos: ficam para o restaurante, sem dados pessoais.
    const { data: pedidos } = await supabaseAdmin.from("pedidos").select("id").eq("cliente_id", cliente.id).limit(5000);
    const ids = (pedidos ?? []).map((p) => p.id);
    if (ids.length) {
      const { error } = await supabaseAdmin
        .from("pedidos")
        .update({
          cliente: "Cliente removido",
          nome: "Cliente removido",
          telefone: "",
          rua: "",
          numero: "",
          complemento: "",
          referencia: "",
          observacoes: null,
          endereco: "",
          cliente_id: null,
        })
        .in("id", ids);
      if (error) throw error;
      await supabaseAdmin.from("avaliacoes").update({ nome: null }).in("pedido_id", ids.map(String));
    }

    await supabaseAdmin.from("enderecos_cliente").delete().eq("cliente_id", cliente.id);
    await supabaseAdmin.from("cliente_fidelidade").delete().eq("cliente_id", cliente.id);
    const { error } = await supabaseAdmin.from("clientes").delete().eq("id", cliente.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[cliente/excluir]", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: "Não foi possível apagar agora. Fale com o restaurante." }, { status: 500 });
  }
}
