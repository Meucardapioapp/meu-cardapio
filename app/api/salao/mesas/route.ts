import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { limitar } from "@/lib/server/rate-limit";
import { acessoSalao, respostaErro, semAcesso } from "@/lib/server/salao-auth";
import { abrirComanda, listarAbertas } from "@/lib/server/salao";

function inicio(req: NextRequest) {
  const desde = req.nextUrl.searchParams.get("desde");
  return desde && !isNaN(Date.parse(desde)) ? new Date(desde).toISOString() : new Date(Date.now() - 24 * 3600 * 1000).toISOString();
}

/** Mesas abertas (painel e garçom). O garçom recebe também o resumo do dia dele. */
export async function GET(req: NextRequest) {
  try {
    const acesso = await acessoSalao(req, ["painel", "garcom"]);
    if (!acesso) return semAcesso();

    const abertas = await listarAbertas(acesso.restauranteId);
    const desde = inicio(req);

    if (acesso.papel === "painel") {
      const { data: fechadas } = await supabaseAdmin
        .from("comandas")
        .select("id, numero, mesa, total, taxa_valor, forma_pagamento, garcom_nome, fechada_em, status")
        .eq("restaurante_id", acesso.restauranteId)
        .in("status", ["fechada", "cancelada"])
        .gte("fechada_em", desde)
        .order("fechada_em", { ascending: false })
        .limit(200);
      return NextResponse.json({ success: true, abertas, fechadas: fechadas ?? [] });
    }

    const eu = acesso.funcionario!;
    const [{ data: minhas }, { data: lancados }] = await Promise.all([
      supabaseAdmin
        .from("comandas")
        .select("id, taxa_servico, taxa_valor, total")
        .eq("restaurante_id", acesso.restauranteId)
        .eq("garcom_id", eu.id)
        .eq("status", "fechada")
        .gte("fechada_em", desde),
      supabaseAdmin
        .from("comanda_itens")
        .select("lancamento")
        .eq("restaurante_id", acesso.restauranteId)
        .eq("lancado_por_id", eu.id)
        .gte("criado_em", desde)
        .limit(3000),
    ]);

    // Itens prontos para levar nas mesas abertas.
    const ids = abertas.map((c) => c.id);
    const { data: prontos } = ids.length
      ? await supabaseAdmin
          .from("comanda_itens")
          .select("id, comanda_id, nome, quantidade, setor, pronto_em, lancado_por_id")
          .in("comanda_id", ids)
          .eq("status", "pronto")
          // Sem preparo (bebida da geladeira) não avisa o garçom.
          .not("setor", "is", null)
          .order("pronto_em", { ascending: true })
      : { data: [] as any[] };

    const mesaDe = new Map(abertas.map((c) => [c.id, c]));
    return NextResponse.json({
      success: true,
      eu: { id: eu.id, nome: eu.nome, restaurante: eu.restaurante_nome },
      abertas,
      prontos: (prontos ?? []).map((p) => ({
        ...p,
        mesa: mesaDe.get(p.comanda_id)?.mesa,
        meu: p.lancado_por_id === eu.id || mesaDe.get(p.comanda_id)?.garcom_id === eu.id,
      })),
      resumo: {
        mesas: (minhas ?? []).length,
        comDez: (minhas ?? []).filter((c) => c.taxa_servico && Number(c.taxa_valor) > 0).length,
        dez: (minhas ?? []).reduce((s, c) => s + Number(c.taxa_valor || 0), 0),
        vendido: (minhas ?? []).reduce((s, c) => s + Number(c.total || 0), 0),
        pedidos: new Set((lancados ?? []).map((l) => l.lancamento)).size,
      },
    });
  } catch (e) {
    return respostaErro(e, "salao/mesas GET");
  }
}

/** Abrir mesa (se já estiver aberta, devolve a comanda dela). */
export async function POST(req: NextRequest) {
  try {
    if (!(await limitar(req, "salao-escrita", 120, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }
    const acesso = await acessoSalao(req, ["painel", "garcom"]);
    if (!acesso) return semAcesso();

    const body = await req.json().catch(() => ({}));
    const autor =
      acesso.papel === "garcom"
        ? { tipo: "garcom" as const, id: acesso.funcionario!.id, nome: acesso.nome }
        : { tipo: "painel" as const, nome: acesso.nome };
    const { comanda, nova } = await abrirComanda(acesso.restauranteId, body?.mesa, {
      autor,
      pessoas: Number(body?.pessoas) || null,
      clienteNome: body?.clienteNome || null,
    });
    return NextResponse.json({ success: true, comanda, nova });
  } catch (e) {
    return respostaErro(e, "salao/mesas POST");
  }
}
