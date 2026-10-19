import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { limitar } from "@/lib/server/rate-limit";
import { acessoSalao, respostaErro, semAcesso, type AcessoSalao } from "@/lib/server/salao-auth";
import { getConfigSalao } from "@/lib/server/salao";

/** Setor que esta tela mostra ("" = todos). Funcionário da cozinha: o setor do cadastro. */
function setorDaTela(acesso: AcessoSalao, req: NextRequest) {
  if (acesso.papel === "cozinha") {
    const s = acesso.funcionario?.setor || "";
    return s === "Todos" ? "" : s;
  }
  return req.nextUrl.searchParams.get("setor") || "";
}

/** Fila de preparo: o que falta fazer, agrupado por pedido (lançamento). */
export async function GET(req: NextRequest) {
  try {
    const acesso = await acessoSalao(req, ["painel", "cozinha"]);
    if (!acesso) return semAcesso();
    const setor = setorDaTela(acesso, req);
    const r = acesso.restauranteId;

    const meiaHora = new Date(Date.now() - 30 * 60000).toISOString();
    let consulta = supabaseAdmin
      .from("comanda_itens")
      .select("id, comanda_id, lancamento, nome, detalhes, observacao, quantidade, setor, status, lancado_por, origem, criado_em, alterado_em, pronto_em, cancelado_em")
      .eq("restaurante_id", r)
      .not("setor", "is", null)
      .or(`status.eq.novo,and(status.eq.pronto,pronto_em.gte."${meiaHora}"),and(status.eq.cancelado,cancelado_em.gte."${meiaHora}",pronto_em.is.null)`)
      .order("criado_em", { ascending: true })
      .limit(500);
    if (setor) consulta = consulta.eq("setor", setor);

    const [{ data: itens, error }, config] = await Promise.all([consulta, getConfigSalao(r)]);
    if (error) throw error;

    const comandaIds = [...new Set((itens ?? []).map((i) => i.comanda_id))];
    const { data: comandas } = comandaIds.length
      ? await supabaseAdmin.from("comandas").select("id, mesa, numero, status").in("id", comandaIds)
      : { data: [] as any[] };
    const mesaDe = new Map((comandas ?? []).map((c) => [c.id, c]));

    // Agrupa por lançamento (cada envio do garçom vira um "pedido" na tela).
    const grupos = new Map<string, any>();
    for (const i of itens ?? []) {
      const c = mesaDe.get(i.comanda_id);
      if (!c || c.status === "cancelada") continue;
      const g =
        grupos.get(i.lancamento) ??
        grupos
          .set(i.lancamento, {
            lancamento: i.lancamento,
            comanda_id: i.comanda_id,
            mesa: c.mesa,
            comanda: c.numero,
            por: i.lancado_por,
            origem: i.origem,
            criado_em: i.criado_em,
            itens: [],
          })
          .get(i.lancamento);
      g.itens.push(i);
    }

    const lista = [...grupos.values()];
    const pendentes = lista.filter((g) => g.itens.some((i: any) => i.status === "novo"));
    const prontos = lista
      .filter((g) => !g.itens.some((i: any) => i.status === "novo") && g.itens.some((i: any) => i.status === "pronto"))
      .reverse();

    return NextResponse.json({
      success: true,
      setor: setor || "Todos",
      setores: config.setores,
      eu: acesso.funcionario ? { nome: acesso.funcionario.nome, restaurante: acesso.funcionario.restaurante_nome } : null,
      pendentes,
      prontos,
    });
  } catch (e) {
    return respostaErro(e, "salao/cozinha GET");
  }
}

/** Marcar pronto (ou desfazer). */
export async function POST(req: NextRequest) {
  try {
    if (!(await limitar(req, "salao-cozinha", 200, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }
    const acesso = await acessoSalao(req, ["painel", "cozinha"]);
    if (!acesso) return semAcesso();
    const setor = setorDaTela(acesso, req);

    const body = await req.json().catch(() => ({}));
    const ids = (Array.isArray(body?.itemIds) ? body.itemIds : []).map(String).slice(0, 100);
    if (!ids.length) return NextResponse.json({ success: false, error: "Nada selecionado." }, { status: 400 });

    const pronto = body?.acao !== "desfazer";
    let consulta = supabaseAdmin
      .from("comanda_itens")
      .update(
        pronto
          ? { status: "pronto", pronto_em: new Date().toISOString(), pronto_por_id: acesso.funcionario?.id ?? null }
          : { status: "novo", pronto_em: null, pronto_por_id: null }
      )
      .eq("restaurante_id", acesso.restauranteId)
      .in("id", ids)
      .eq("status", pronto ? "novo" : "pronto");
    if (setor) consulta = consulta.eq("setor", setor);

    const { data, error } = await consulta.select("id");
    if (error) throw error;
    return NextResponse.json({ success: true, alterados: (data ?? []).length });
  } catch (e) {
    return respostaErro(e, "salao/cozinha POST");
  }
}
