import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { acessoNegado, erroInterno, isDonoDaPlataforma } from "@/lib/server/auth";
import { PLANOS } from "@/lib/planos";

/**
 * Painel da plataforma (só o dono, OWNER_USER_ID): todos os restaurantes
 * clientes, situação do plano, uso do cardápio e receita.
 * Nunca devolve dados bancários, CPF/CNPJ ou dados dos clientes finais.
 */

export const maxDuration = 60;

const DIA = 86400000;

async function todas<T = any>(consulta: (de: number, ate: number) => PromiseLike<{ data: any; error: any }>, limite = 60000) {
  const linhas: T[] = [];
  for (let de = 0; de < limite; de += 1000) {
    const { data, error } = await consulta(de, de + 999);
    if (error) throw error;
    linhas.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return linhas;
}

/** Dia (AAAA-MM-DD) no horário de Brasília. */
function diaBR(iso: string | number) {
  return new Date(new Date(iso).getTime() - 3 * 3600 * 1000).toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  try {
    if (!(await isDonoDaPlataforma(req))) return acessoNegado();

    const agora = Date.now();
    const desde30 = new Date(agora - 30 * DIA).toISOString();
    const desde90 = new Date(agora - 90 * DIA).toISOString();

    const [restaurantes, assinaturas, pagamentos, pedidos, produtos, financeiro, operacao] = await Promise.all([
      todas((de, ate) =>
        supabaseAdmin
          .from("restaurantes")
          .select("id, slug, nome_restaurante, nome_responsavel, email, whatsapp, cidade, estado, categoria, created_at")
          .order("created_at", { ascending: false })
          .range(de, ate)
      ),
      todas((de, ate) => supabaseAdmin.from("assinaturas").select("restaurante_id, status, plano, metodo, acesso_ate, created_at, updated_at").range(de, ate)),
      todas((de, ate) =>
        supabaseAdmin
          .from("pagamentos_assinatura")
          .select("restaurante_id, metodo, valor, status, pago_em, created_at")
          .gte("created_at", desde90)
          .range(de, ate)
      ),
      todas((de, ate) =>
        supabaseAdmin
          .from("pedidos")
          .select("restaurante_id, created_at, total, payment_method, payment_status, status")
          .gte("created_at", desde30)
          .range(de, ate)
      ),
      todas((de, ate) => supabaseAdmin.from("produtos").select("restaurante_id").eq("ativo", true).range(de, ate)),
      todas((de, ate) => supabaseAdmin.from("restaurantes_financeiro").select("restaurante_id, pagarme_recipient_id").range(de, ate)),
      todas((de, ate) => supabaseAdmin.from("restaurante_operacao").select("restaurante_id, pausa_indefinida, pausado_ate").range(de, ate)).catch(
        () => [] as any[]
      ),
    ]);

    const assinaturaDe = new Map(assinaturas.map((a: any) => [String(a.restaurante_id), a]));
    const produtosDe = new Map<string, number>();
    for (const p of produtos as any[]) produtosDe.set(String(p.restaurante_id), (produtosDe.get(String(p.restaurante_id)) ?? 0) + 1);
    const pixOnline = new Set((financeiro as any[]).filter((f) => f.pagarme_recipient_id).map((f) => String(f.restaurante_id)));
    const pausado = new Set(
      (operacao as any[])
        .filter((o) => o.pausa_indefinida || (o.pausado_ate && new Date(o.pausado_ate).getTime() > agora))
        .map((o) => String(o.restaurante_id))
    );

    // Pedidos válidos: Pix só quando pago; recusados e cancelados não contam.
    const validos = (pedidos as any[]).filter(
      (p) =>
        !["recusado", "cancelado"].includes(String(p.status)) &&
        (p.payment_method !== "pix" || p.payment_status === "approved")
    );

    const hoje = diaBR(agora);
    const ultimos7 = Array.from({ length: 7 }, (_, i) => diaBR(agora - (6 - i) * DIA));
    const ultimos30 = Array.from({ length: 30 }, (_, i) => diaBR(agora - (29 - i) * DIA));

    type Uso = { pedidos: number; vendas: number; pix: number; dias: Set<string>; ultimo: string | null; porDia: Map<string, number> };
    const usoDe = new Map<string, Uso>();
    const pedidosPorDia = new Map<string, number>();
    let volumePix = 0;
    for (const p of validos) {
      const id = String(p.restaurante_id);
      const u = usoDe.get(id) ?? { pedidos: 0, vendas: 0, pix: 0, dias: new Set(), ultimo: null, porDia: new Map() };
      const dia = diaBR(p.created_at);
      u.pedidos++;
      u.vendas += Number(p.total || 0);
      if (p.payment_method === "pix") {
        u.pix += Number(p.total || 0);
        volumePix += Number(p.total || 0);
      }
      u.dias.add(dia);
      u.porDia.set(dia, (u.porDia.get(dia) ?? 0) + 1);
      if (!u.ultimo || p.created_at > u.ultimo) u.ultimo = p.created_at;
      usoDe.set(id, u);
      pedidosPorDia.set(dia, (pedidosPorDia.get(dia) ?? 0) + 1);
    }

    const pagosPor = new Map<string, any[]>();
    for (const pg of pagamentos as any[]) {
      if (pg.status !== "paid") continue;
      const id = String(pg.restaurante_id);
      if (!pagosPor.has(id)) pagosPor.set(id, []);
      pagosPor.get(id)!.push(pg);
    }

    const clientes = (restaurantes as any[]).map((r) => {
      const id = String(r.id);
      const a: any = assinaturaDe.get(id);
      const acessoAte = a?.acesso_ate ? new Date(a.acesso_ate).getTime() : 0;
      const dentroDoPrazo = acessoAte > agora;
      let situacao: "pagante" | "teste" | "inadimplente" | "vencido" | "cancelado" = "vencido";
      if (a?.status === "ativa" && dentroDoPrazo) situacao = "pagante";
      else if (a?.status === "trial" && dentroDoPrazo) situacao = "teste";
      else if (a?.status === "inadimplente") situacao = "inadimplente";
      else if (a?.status === "cancelada" && !dentroDoPrazo) situacao = "cancelado";
      else if (a?.status === "cancelada" && dentroDoPrazo) situacao = "pagante";

      const u = usoDe.get(id);
      const dias7 = ultimos7.filter((d) => u?.dias.has(d)).length;
      const pagos = (pagosPor.get(id) ?? []).sort((x, y) => String(y.pago_em).localeCompare(String(x.pago_em)));

      return {
        id,
        slug: r.slug,
        nome: r.nome_restaurante || "(sem nome)",
        responsavel: r.nome_responsavel || "",
        email: r.email || "",
        whatsapp: String(r.whatsapp || "").replace(/\D/g, ""),
        cidade: [r.cidade, r.estado].filter(Boolean).join(" - "),
        categoria: r.categoria || "",
        cadastro: r.created_at,
        situacao,
        statusPlano: a?.status ?? null,
        metodo: a?.metodo ?? null,
        acessoAte: a?.acesso_ate ?? null,
        diasRestantes: acessoAte ? Math.ceil((acessoAte - agora) / DIA) : null,
        cancelouRenovacao: a?.status === "cancelada" && dentroDoPrazo,
        pagamentos: pagos.length,
        pago30: Math.round(pagos.filter((x) => x.pago_em && x.pago_em >= desde30).reduce((t, x) => t + Number(x.valor || 0), 0) * 100) / 100,
        ultimoPagamento: pagos[0]?.pago_em ?? null,
        pedidos30: u?.pedidos ?? 0,
        vendas30: Math.round((u?.vendas ?? 0) * 100) / 100,
        pix30: Math.round((u?.pix ?? 0) * 100) / 100,
        diasComVenda7: dias7,
        diasComVenda30: u?.dias.size ?? 0,
        semana: ultimos7.map((d) => u?.porDia.get(d) ?? 0),
        vendeuHoje: Boolean(u?.dias.has(hoje)),
        ultimoPedido: u?.ultimo ?? null,
        produtos: produtosDe.get(id) ?? 0,
        pixOnline: pixOnline.has(id),
        pausado: pausado.has(id),
      };
    });

    const conta = (f: (c: (typeof clientes)[number]) => boolean) => clientes.filter(f).length;
    const pagantes = clientes.filter((c) => c.situacao === "pagante");
    const preco = PLANOS.mensal.preco;
    const receita30 = (pagamentos as any[])
      .filter((p) => p.status === "paid" && p.pago_em && p.pago_em >= desde30)
      .reduce((t, p) => t + Number(p.valor || 0), 0);

    // Cadastros por semana (últimas 12) e quantos desses já pagaram.
    const semanas = Array.from({ length: 12 }, (_, i) => {
      const fim = agora - (11 - i) * 7 * DIA;
      const ini = fim - 7 * DIA;
      const da = clientes.filter((c) => {
        const t = new Date(c.cadastro).getTime();
        return t > ini && t <= fim;
      });
      return { inicio: diaBR(ini + DIA), cadastros: da.length, pagantes: da.filter((c) => c.pagamentos > 0 || c.situacao === "pagante").length };
    });

    const resumo = {
      total: clientes.length,
      novos7: conta((c) => agora - new Date(c.cadastro).getTime() < 7 * DIA),
      novos30: conta((c) => agora - new Date(c.cadastro).getTime() < 30 * DIA),
      pagantes: pagantes.length,
      cartao: pagantes.filter((c) => c.metodo === "cartao").length,
      pix: pagantes.filter((c) => c.metodo === "pix").length,
      teste: conta((c) => c.situacao === "teste"),
      testeAcabando: conta((c) => c.situacao === "teste" && (c.diasRestantes ?? 99) <= 3),
      inadimplentes: conta((c) => c.situacao === "inadimplente"),
      vencidos: conta((c) => c.situacao === "vencido" || c.situacao === "cancelado"),
      cancelaramRenovacao: conta((c) => c.cancelouRenovacao),
      mrr: Math.round(pagantes.length * preco * 100) / 100,
      receita30: Math.round(receita30 * 100) / 100,
      comissaoPix30: Math.round(volumePix * 0.01 * 100) / 100,
      volumePix30: Math.round(volumePix * 100) / 100,
      vendasTotais30: Math.round(validos.reduce((t, p) => t + Number(p.total || 0), 0) * 100) / 100,
      pedidos30: validos.length,
      vendemTodoDia: conta((c) => c.diasComVenda7 >= 6),
      ativos7: conta((c) => c.diasComVenda7 > 0),
      vendeuHoje: conta((c) => c.vendeuHoje),
      semVenda7: conta((c) => (c.situacao === "pagante" || c.situacao === "teste") && c.diasComVenda7 === 0),
      semProdutos: conta((c) => c.produtos === 0),
      pixOnline: conta((c) => c.pixOnline),
      // Conversão: dos que terminaram o teste, quantos pagaram alguma vez.
      conversao: (() => {
        const terminaram = clientes.filter((c) => c.situacao !== "teste");
        const pagaram = terminaram.filter((c) => c.pagamentos > 0 || c.situacao === "pagante");
        return terminaram.length ? Math.round((pagaram.length / terminaram.length) * 1000) / 10 : 0;
      })(),
    };

    return NextResponse.json({
      success: true,
      geradoEm: new Date(agora).toISOString(),
      preco,
      resumo,
      semanas,
      pedidosPorDia: ultimos30.map((d) => ({ dia: d, pedidos: pedidosPorDia.get(d) ?? 0 })),
      clientes,
    });
  } catch (error) {
    return erroInterno("plataforma/clientes", error);
  }
}
