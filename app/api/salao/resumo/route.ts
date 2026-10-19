import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { acessoSalao, respostaErro, semAcesso } from "@/lib/server/salao-auth";

/** Resumo leve para o aviso do menu: mesas abertas, quem pediu a conta, último pedido lançado. */
export async function GET(req: NextRequest) {
  try {
    const acesso = await acessoSalao(req, ["painel"]);
    if (!acesso) return semAcesso();

    const { data: abertas, error } = await supabaseAdmin
      .from("comandas")
      .select("id, pediu_conta")
      .eq("restaurante_id", acesso.restauranteId)
      .eq("status", "aberta")
      .limit(300);
    if (error) return NextResponse.json({ success: true, ativo: false });

    const ids = (abertas ?? []).map((c) => c.id);
    const { data: ultimo } = ids.length
      ? await supabaseAdmin
          .from("comanda_itens")
          .select("criado_em")
          .in("comanda_id", ids)
          .neq("origem", "painel")
          .order("criado_em", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null };

    return NextResponse.json({
      success: true,
      ativo: true,
      abertas: ids.length,
      pediramConta: (abertas ?? []).filter((c) => c.pediu_conta).length,
      ultimoLancamento: ultimo?.criado_em ?? null,
    });
  } catch (e) {
    return respostaErro(e, "salao/resumo");
  }
}
