import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getDonoAutenticado, naoAutenticado } from "@/lib/server/auth";
import { respostaErro } from "@/lib/server/salao-auth";

const arred = (v: number) => Math.round(v * 100) / 100;

/** Relatório do salão e desempenho da equipe no período. */
export async function GET(req: NextRequest) {
  try {
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();
    const r = dono.restaurante.id;

    const p = req.nextUrl.searchParams;
    const desde = p.get("desde") && !isNaN(Date.parse(p.get("desde")!)) ? new Date(p.get("desde")!) : new Date(Date.now() - 86400000);
    const ate = p.get("ate") && !isNaN(Date.parse(p.get("ate")!)) ? new Date(p.get("ate")!) : new Date();
    if (ate.getTime() - desde.getTime() > 400 * 86400000) {
      return NextResponse.json({ success: false, error: "Escolha um período de até 1 ano." }, { status: 400 });
    }
    const de = desde.toISOString();
    const a = ate.toISOString();

    const [{ data: comandas, error }, { data: itens }, { data: prontos }, { data: entregas }, { data: equipe }, { data: delivery }] =
      await Promise.all([
        supabaseAdmin
          .from("comandas")
          .select("id, garcom_id, garcom_nome, subtotal, taxa_servico, taxa_valor, desconto, total, pago_antecipado, pagamentos, troco, pessoas")
          .eq("restaurante_id", r)
          .eq("status", "fechada")
          .gte("fechada_em", de)
          .lte("fechada_em", a)
          .limit(20000),
        supabaseAdmin
          .from("comanda_itens")
          .select("lancamento, lancado_por_id, quantidade, status")
          .eq("restaurante_id", r)
          .gte("criado_em", de)
          .lte("criado_em", a)
          .limit(50000),
        supabaseAdmin
          .from("comanda_itens")
          .select("pronto_por_id, quantidade, criado_em, pronto_em")
          .eq("restaurante_id", r)
          .not("pronto_por_id", "is", null)
          .gte("pronto_em", de)
          .lte("pronto_em", a)
          .limit(50000),
        supabaseAdmin
          .from("pedidos")
          .select("motoboy_id, taxa_entrega")
          .eq("restaurante_id", r)
          .eq("status", "concluido")
          .not("motoboy_id", "is", null)
          .gte("entregue_em", de)
          .lte("entregue_em", a)
          .limit(20000),
        supabaseAdmin.from("funcionarios").select("id, nome, funcao, setor, ativo").eq("restaurante_id", r).order("nome"),
        supabaseAdmin
          .from("pedidos")
          .select("total, comanda_id")
          .eq("restaurante_id", r)
          .eq("status", "concluido")
          .gte("created_at", de)
          .lte("created_at", a)
          .limit(20000),
      ]);
    if (error) throw error;

    const lista = comandas ?? [];
    const formas: Record<string, number> = {};
    for (const c of lista) {
      for (const pg of Array.isArray(c.pagamentos) ? c.pagamentos : []) {
        formas[pg.forma] = arred((formas[pg.forma] ?? 0) + Number(pg.valor || 0));
      }
      if (Number(c.pago_antecipado) > 0) formas.pix_online = arred((formas.pix_online ?? 0) + Number(c.pago_antecipado));
    }

    const salao = {
      contas: lista.length,
      vendido: arred(lista.reduce((s, c) => s + Number(c.total || 0), 0)),
      consumo: arred(lista.reduce((s, c) => s + Number(c.subtotal || 0), 0)),
      taxaServico: arred(lista.reduce((s, c) => s + Number(c.taxa_valor || 0), 0)),
      descontos: arred(lista.reduce((s, c) => s + Number(c.desconto || 0), 0)),
      comDez: lista.filter((c) => c.taxa_servico && Number(c.taxa_valor) > 0).length,
      pessoas: lista.reduce((s, c) => s + Number(c.pessoas || 0), 0),
      formas,
    };

    const deliveryLista = (delivery ?? []).filter((d) => !d.comanda_id);
    const resumoDelivery = { pedidos: deliveryLista.length, vendido: arred(deliveryLista.reduce((s, d) => s + Number(d.total || 0), 0)) };

    const pessoas = (equipe ?? []).map((f) => {
      const base = { id: f.id, nome: f.nome, funcao: f.funcao, setor: f.setor, ativo: f.ativo };
      if (f.funcao === "garcom") {
        const minhas = lista.filter((c) => c.garcom_id === f.id);
        const meusItens = (itens ?? []).filter((i) => i.lancado_por_id === f.id && i.status !== "cancelado");
        return {
          ...base,
          mesas: minhas.length,
          pedidos: new Set(meusItens.map((i) => i.lancamento)).size,
          itens: meusItens.reduce((s, i) => s + Number(i.quantidade), 0),
          comDez: minhas.filter((c) => c.taxa_servico && Number(c.taxa_valor) > 0).length,
          dez: arred(minhas.reduce((s, c) => s + Number(c.taxa_valor || 0), 0)),
          vendido: arred(minhas.reduce((s, c) => s + Number(c.total || 0), 0)),
        };
      }
      if (f.funcao === "cozinha") {
        const meus = (prontos ?? []).filter((i) => i.pronto_por_id === f.id);
        const minutos = meus.map((i) => (new Date(i.pronto_em).getTime() - new Date(i.criado_em).getTime()) / 60000).filter((m) => m >= 0);
        return {
          ...base,
          itens: meus.reduce((s, i) => s + Number(i.quantidade), 0),
          tempoMedio: minutos.length ? Math.round(minutos.reduce((s, m) => s + m, 0) / minutos.length) : null,
        };
      }
      const minhas = (entregas ?? []).filter((e) => e.motoboy_id === f.id);
      return { ...base, entregas: minhas.length, taxas: arred(minhas.reduce((s, e) => s + Number(e.taxa_entrega || 0), 0)) };
    });

    // Mesas atendidas por quem já saiu da equipe (ou pelo caixa / QR da mesa)
    const semCadastro = lista.filter((c) => !c.garcom_id || !(equipe ?? []).some((f) => f.id === c.garcom_id));
    const outros = {
      mesas: semCadastro.length,
      dez: arred(semCadastro.reduce((s, c) => s + Number(c.taxa_valor || 0), 0)),
      vendido: arred(semCadastro.reduce((s, c) => s + Number(c.total || 0), 0)),
    };

    return NextResponse.json({ success: true, salao, delivery: resumoDelivery, equipe: pessoas, outros });
  } catch (e) {
    return respostaErro(e, "salao/relatorio");
  }
}
