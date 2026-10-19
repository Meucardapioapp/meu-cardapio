import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno, getDonoAutenticado, naoAutenticado } from "@/lib/server/auth";
import { limitar } from "@/lib/server/rate-limit";
import { fusoDoEstado } from "@/lib/horario";

const DIA = 86400000;

type Pedido = {
  created_at: string;
  total: number | null;
  payment_method: string | null;
  payment_status: string | null;
  status: string | null;
  tipo_pedido: string | null;
  itens: any;
  cliente_id: string | null;
  telefone: string | null;
  numero_pedido: number | null;
  nome: string | null;
  bairro: string | null;
  desconto_cupom?: number | null;
  desconto_fidelidade?: number | null;
  mesa?: string | null;
};

const valido = (p: Pedido) =>
  !["recusado", "cancelado"].includes(String(p.status)) &&
  (p.payment_method !== "pix" || p.payment_status === "approved");

/** Busca todos os pedidos do intervalo (a API devolve no máximo 1000 por vez). */
async function buscarPedidos(restauranteId: string, de: Date, ate: Date) {
  const todos: Pedido[] = [];
  for (let inicio = 0; inicio < 30000; inicio += 1000) {
    const { data, error } = await supabaseAdmin
      .from("pedidos")
      .select("*")
      .eq("restaurante_id", restauranteId)
      .gte("created_at", de.toISOString())
      .lt("created_at", ate.toISOString())
      .order("created_at", { ascending: true })
      .range(inicio, inicio + 999);
    if (error) throw error;
    // Pedido do QR da mesa que entrou na comanda conta no salão (não duas vezes).
    todos.push(...((data ?? []) as any[]).filter((p) => !p.comanda_id));
    if (!data || data.length < 1000) break;
  }
  return todos;
}

/** Contas fechadas no salão (mesas). Se o SQL 15 ainda não rodou, volta vazio. */
async function buscarComandas(restauranteId: string, de: Date, ate: Date) {
  const { data, error } = await supabaseAdmin
    .from("comandas")
    .select("numero, mesa, garcom_nome, subtotal, taxa_valor, desconto, total, pago_antecipado, pagamentos, forma_pagamento, fechada_em")
    .eq("restaurante_id", restauranteId)
    .eq("status", "fechada")
    .gte("fechada_em", de.toISOString())
    .lt("fechada_em", ate.toISOString())
    .order("fechada_em", { ascending: true })
    .limit(20000);
  return error ? [] : data ?? [];
}

const formaTexto: Record<string, string> = { pix: "Pix", debito: "Débito", credito: "Crédito", dinheiro: "Dinheiro", outro: "Outro", pix_online: "Pix online (QR)" };

function resumir(pedidos: Pedido[]) {
  const validos = pedidos.filter(valido);
  const faturamento = validos.reduce((s, p) => s + Number(p.total || 0), 0);
  const clientes = new Set(validos.map((p) => p.cliente_id || String(p.telefone || "").replace(/\D/g, "")).filter(Boolean));
  return {
    pedidos: validos.length,
    faturamento: Math.round(faturamento * 100) / 100,
    ticketMedio: validos.length ? Math.round((faturamento / validos.length) * 100) / 100 : 0,
    cancelados: pedidos.filter((p) => ["recusado", "cancelado"].includes(String(p.status))).length,
    clientes: clientes.size,
    descontos:
      Math.round(
        validos.reduce((s, p) => s + Number(p.desconto_cupom || 0) + Number(p.desconto_fidelidade || 0), 0) * 100
      ) / 100,
  };
}

const metodoTexto: Record<string, string> = { pix: "Pix online", pix_chave: "Pix na sua chave", cash: "Dinheiro", card_delivery: "Cartão na entrega" };
const tipoTexto: Record<string, string> = { entrega: "Entrega", retirada: "Retirada", mesa: "Mesa" };

/**
 * Relatório de vendas do restaurante logado.
 * ?dias=7 (padrão) ou ?de=AAAA-MM-DD&ate=AAAA-MM-DD; ?formato=csv baixa a planilha.
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await limitar(req, "relatorios", 60, 60))) {
      return NextResponse.json({ success: false, error: "Muitas consultas. Aguarde um pouco." }, { status: 429 });
    }

    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    const { data: rest } = await supabaseAdmin.from("restaurantes").select("uf").eq("id", dono.restaurante.id).maybeSingle();
    const fuso = fusoDoEstado(rest?.uf);
    const fusoMs = fuso * 3600000;

    // Meia-noite de hoje no fuso do restaurante.
    const agoraLocal = Date.now() + fusoMs;
    const hojeLocal = Math.floor(agoraLocal / DIA) * DIA;

    const sp = req.nextUrl.searchParams;
    let deLocal: number;
    let ateLocal: number;
    const reData = /^\d{4}-\d{2}-\d{2}$/;

    if (reData.test(sp.get("de") || "") && reData.test(sp.get("ate") || "")) {
      deLocal = Date.parse(`${sp.get("de")}T00:00:00Z`);
      ateLocal = Date.parse(`${sp.get("ate")}T00:00:00Z`) + DIA;
    } else {
      const dias = Math.min(366, Math.max(1, Math.floor(Number(sp.get("dias") || 7))));
      ateLocal = hojeLocal + DIA;
      deLocal = ateLocal - dias * DIA;
    }

    if (!(ateLocal > deLocal) || ateLocal - deLocal > 366 * DIA) {
      return NextResponse.json({ success: false, error: "Período inválido (máximo 1 ano)." }, { status: 400 });
    }

    const de = new Date(deLocal - fusoMs);
    const ate = new Date(ateLocal - fusoMs);
    const duracao = ateLocal - deLocal;

    const [pedidos, anteriores, comandas] = await Promise.all([
      buscarPedidos(dono.restaurante.id, de, ate),
      buscarPedidos(dono.restaurante.id, new Date(de.getTime() - duracao), de),
      buscarComandas(dono.restaurante.id, de, ate),
    ]);

    const dataLocal = (iso: string) => new Date(new Date(iso).getTime() + fusoMs);

    // ---------- planilha ----------
    if (sp.get("formato") === "csv") {
      const linhas = [
        ["Data", "Hora", "Pedido", "Cliente", "Telefone", "Tipo", "Bairro/Mesa", "Pagamento", "Situação", "Itens", "Descontos", "Total"],
      ];
      for (const p of pedidos) {
        const d = dataLocal(p.created_at);
        linhas.push([
          d.toISOString().slice(0, 10).split("-").reverse().join("/"),
          d.toISOString().slice(11, 16),
          String(p.numero_pedido ?? ""),
          String(p.nome || ""),
          String(p.telefone || ""),
          tipoTexto[String(p.tipo_pedido)] ?? String(p.tipo_pedido || ""),
          p.tipo_pedido === "mesa" ? `Mesa ${p.mesa ?? ""}` : String(p.bairro || ""),
          metodoTexto[String(p.payment_method)] ?? String(p.payment_method || ""),
          valido(p) ? "Concluído/válido" : ["recusado", "cancelado"].includes(String(p.status)) ? "Cancelado" : "Pix não pago",
          (Array.isArray(p.itens) ? p.itens : []).map((i: any) => `${i.quantity}x ${i.nome}`).join(" | "),
          (Number(p.desconto_cupom || 0) + Number(p.desconto_fidelidade || 0)).toFixed(2).replace(".", ","),
          Number(p.total || 0).toFixed(2).replace(".", ","),
        ]);
      }
      for (const c of comandas) {
        const d = dataLocal(c.fechada_em);
        const formas = (Array.isArray(c.pagamentos) ? c.pagamentos : []).map((pg: any) => formaTexto[pg.forma] ?? pg.forma);
        if (Number(c.pago_antecipado) > 0) formas.push("Pix online (QR)");
        linhas.push([
          d.toISOString().slice(0, 10).split("-").reverse().join("/"),
          d.toISOString().slice(11, 16),
          `Comanda ${c.numero}`,
          String(c.garcom_nome ? `Garçom: ${c.garcom_nome}` : ""),
          "",
          "Salão",
          `Mesa ${c.mesa}`,
          formas.join(" + "),
          Number(c.taxa_valor) > 0 ? `Fechada (10%: ${Number(c.taxa_valor).toFixed(2).replace(".", ",")})` : "Fechada",
          "",
          Number(c.desconto || 0).toFixed(2).replace(".", ","),
          Number(c.total || 0).toFixed(2).replace(".", ","),
        ]);
      }
      const csv =
        "﻿" +
        linhas
          .map((l) => l.map((c) => (/[;"\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(";"))
          .join("\r\n");
      const nome = `vendas_${new Date(deLocal).toISOString().slice(0, 10)}_a_${new Date(ateLocal - DIA).toISOString().slice(0, 10)}.csv`;
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${nome}"`,
        },
      });
    }

    // ---------- números ----------
    const validos = pedidos.filter(valido);

    const porDia = new Map<string, { pedidos: number; faturamento: number }>();
    for (let t = deLocal; t < ateLocal; t += DIA) {
      porDia.set(new Date(t).toISOString().slice(0, 10), { pedidos: 0, faturamento: 0 });
    }
    const porHora = Array.from({ length: 24 }, () => 0);
    const porPagamento: Record<string, number> = {};
    const porTipo: Record<string, number> = {};
    const produtos = new Map<string, { nome: string; quantidade: number; receita: number }>();

    for (const p of validos) {
      const d = dataLocal(p.created_at);
      const chave = d.toISOString().slice(0, 10);
      const dia = porDia.get(chave);
      if (dia) {
        dia.pedidos += 1;
        dia.faturamento += Number(p.total || 0);
      }
      porHora[d.getUTCHours()] += 1;
      const metodo = metodoTexto[String(p.payment_method)] ?? "Outro";
      porPagamento[metodo] = (porPagamento[metodo] ?? 0) + Number(p.total || 0);
      const tipo = tipoTexto[String(p.tipo_pedido)] ?? "Entrega";
      porTipo[tipo] = (porTipo[tipo] ?? 0) + 1;

      for (const item of Array.isArray(p.itens) ? p.itens : []) {
        const id = String(item?.id ?? item?.nome ?? "");
        if (!id) continue;
        const atual = produtos.get(id) ?? { nome: String(item?.nome || "Produto"), quantidade: 0, receita: 0 };
        const qtd = Number(item?.quantity || 1);
        atual.quantidade += qtd;
        atual.receita += Number(item?.preco || 0) * qtd;
        produtos.set(id, atual);
      }
    }

    const arred = (v: number) => Math.round(v * 100) / 100;

    const salaoPagamento: Record<string, number> = {};
    for (const c of comandas) {
      for (const pg of Array.isArray(c.pagamentos) ? c.pagamentos : []) {
        const nome = formaTexto[pg.forma] ?? "Outro";
        salaoPagamento[nome] = (salaoPagamento[nome] ?? 0) + Number(pg.valor || 0);
      }
      if (Number(c.pago_antecipado) > 0) salaoPagamento["Pix online (QR)"] = (salaoPagamento["Pix online (QR)"] ?? 0) + Number(c.pago_antecipado);
    }
    const salao = {
      contas: comandas.length,
      faturamento: arred(comandas.reduce((s, c) => s + Number(c.total || 0), 0)),
      taxaServico: arred(comandas.reduce((s, c) => s + Number(c.taxa_valor || 0), 0)),
      porPagamento: Object.entries(salaoPagamento).map(([nome, valor]) => ({ nome, valor: arred(valor) })).sort((a, b) => b.valor - a.valor),
    };

    return NextResponse.json({
      success: true,
      periodo: {
        de: new Date(deLocal).toISOString().slice(0, 10),
        ate: new Date(ateLocal - DIA).toISOString().slice(0, 10),
        dias: Math.round(duracao / DIA),
      },
      resumo: resumir(pedidos),
      salao,
      anterior: resumir(anteriores),
      porDia: [...porDia.entries()].map(([dia, v]) => ({ dia, pedidos: v.pedidos, faturamento: arred(v.faturamento) })),
      porHora,
      porPagamento: Object.entries(porPagamento)
        .map(([nome, valor]) => ({ nome, valor: arred(valor) }))
        .sort((a, b) => b.valor - a.valor),
      porTipo: Object.entries(porTipo).map(([nome, pedidos]) => ({ nome, pedidos })),
      produtos: [...produtos.values()]
        .map((p) => ({ ...p, receita: arred(p.receita) }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 15),
    });
  } catch (error) {
    return erroInterno("painel/relatorios", error);
  }
}
