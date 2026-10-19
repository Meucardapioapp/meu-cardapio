import { limitar } from "@/lib/server/rate-limit";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { esquemaPerfilCliente, primeiroErro } from "@/lib/esquemas";
import { criptografar } from "@/lib/server/cripto";

export async function PUT(req: Request) {
  try {
    if (!(await limitar(req, "cliente-editar", 20, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }

    const validacao = esquemaPerfilCliente.safeParse(await req.json());

    if (!validacao.success) {
      return NextResponse.json({ success: false, error: primeiroErro(validacao.error) }, { status: 400 });
    }

    const { token, nome, telefone, cpf } = validacao.data;

    const { data: cliente } = await supabaseAdmin
      .from("clientes")
      .select("id, restaurante_id, telefone")
      .eq("token_acesso", token)
      .maybeSingle();

    if (!cliente) {
      return NextResponse.json({ success: false, error: "Cliente não encontrado." }, { status: 404 });
    }

    // Não deixa usar o telefone de outro cliente do mesmo restaurante
    // (seria um jeito de "assumir" o histórico e os selos de outra pessoa).
    if (telefone !== cliente.telefone) {
      const { data: outro } = await supabaseAdmin
        .from("clientes")
        .select("id")
        .eq("restaurante_id", cliente.restaurante_id)
        .eq("telefone", telefone)
        .neq("id", cliente.id)
        .limit(1)
        .maybeSingle();

      if (outro) {
        return NextResponse.json(
          { success: false, error: "Este telefone já está em outra conta. Fale com o restaurante." },
          { status: 409 }
        );
      }
    }

    const { error } = await supabaseAdmin
      .from("clientes")
      .update({ nome, telefone, cpf: cpf ? criptografar(cpf.replace(/\D/g, "")) : null })
      .eq("id", cliente.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[cliente/editar]", error);
    return NextResponse.json({ success: false, error: "Erro ao salvar. Tente novamente." }, { status: 500 });
  }
}
