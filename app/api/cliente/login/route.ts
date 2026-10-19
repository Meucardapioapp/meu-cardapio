import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { limitar, limitarChave } from "@/lib/server/rate-limit";

/**
 * Login do cliente final: telefone + número de um pedido anterior.
 * Só o telefone não basta (qualquer um que soubesse o número
 * entraria na conta e veria endereços e histórico).
 */
export async function POST(req: NextRequest) {
  try {
    if (!await limitar(req, "cliente-login", 6, 900)) {
      return NextResponse.json(
        { success: false, error: "Muitas tentativas. Aguarde 15 minutos." },
        { status: 429 }
      );
    }

    const { telefone, slug, numeroPedido } = await req.json();
    const numero = Number(String(numeroPedido ?? "").replace(/\D/g, ""));

    const telefoneChave = String(telefone ?? "").replace(/\D/g, "");
    if (
      !(await limitarChave("cliente-login-telefone", telefoneChave, 5, 900)) ||
      !(await limitarChave("cliente-login-telefone-dia", telefoneChave, 15, 86400))
    ) {
      return NextResponse.json(
        { success: false, error: "Muitas tentativas para este telefone. Aguarde 15 minutos." },
        { status: 429 }
      );
    }

    if (!telefone || !slug || !numero) {
      return NextResponse.json({
        success: false,
        error: "Informe o telefone e o número de um pedido seu.",
      });
    }

    const { data: restaurante } = await supabaseAdmin
      .from("restaurantes")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!restaurante) {
      return NextResponse.json({ success: false, error: "Restaurante não encontrado." });
    }

    const { data: cliente } = await supabaseAdmin
      .from("clientes")
      .select("id, token_acesso")
      .eq("telefone", telefone)
      .eq("restaurante_id", restaurante.id)
      .maybeSingle();

    const { data: pedido } = cliente
      ? await supabaseAdmin
          .from("pedidos")
          .select("id")
          .eq("cliente_id", cliente.id)
          .eq("restaurante_id", restaurante.id)
          .eq("numero_pedido", numero)
          .limit(1)
          .maybeSingle()
      : { data: null };

    if (!cliente || !pedido) {
      return NextResponse.json({
        success: false,
        error: "Não encontramos um pedido com esse telefone e número.",
      });
    }

    return NextResponse.json({ success: true, token: cliente.token_acesso });
  } catch (error) {
    console.error("[cliente/login]", error);
    return NextResponse.json({ success: false, error: "Erro ao entrar. Tente novamente." });
  }
}
