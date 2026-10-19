"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { NOME_FORMA, type Comanda, type ItemComanda } from "@/app/components/salao/comum";

const dinheiro = (v: number) => `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

/**
 * Impressão do salão (impressora térmica 58/80 mm):
 *  - sem parâmetros: a CONTA da mesa (para o garçom levar);
 *  - ?l=<lançamento>: o PEDIDO para a cozinha (sem preços). &s=<setor> filtra o setor.
 */
export default function ImpressaoSalao() {
  const { id } = useParams<{ id: string }>();
  const busca = useSearchParams();
  const lancamento = busca.get("l");
  const setor = busca.get("s");
  const [dados, setDados] = useState<{ restaurante: string; comanda: Comanda; itens: ItemComanda[] } | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    (async () => {
      // Painel: manda o login do painel. Cozinha/garçom: o cookie do celular vai sozinho.
      const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }) as any);
      const headers: Record<string, string> = {};
      if (data?.session?.access_token) headers.Authorization = `Bearer ${data.session.access_token}`;
      const r = await fetch(`/api/salao/comanda?id=${id}`, { headers, cache: "no-store" });
      const d = await r.json().catch(() => null);
      if (!d?.success) setErro(d?.error || "Comanda não encontrada.");
      else setDados(d);
    })();
  }, [id]);

  useEffect(() => {
    if (!dados) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [dados]);

  if (erro) return <main style={{ padding: 30, fontFamily: "monospace" }}>{erro}</main>;
  if (!dados) return <main style={{ padding: 30, fontFamily: "monospace" }}>Carregando…</main>;

  const { comanda: c, itens, restaurante } = dados;
  const linha = { display: "flex", justifyContent: "space-between", gap: 6 } as const;
  const quebra = { flex: 1, wordBreak: "break-word", overflowWrap: "break-word" } as const;
  const valor = { width: 72, textAlign: "right", flexShrink: 0 } as const;

  const estilo = (
    <style>{`
      *{box-sizing:border-box}
      html,body{margin:0;padding:0;width:100%;font-family:monospace;background:#fff;color:#000}
      @page{size:auto;margin:2mm}
      hr{border:none;border-top:1px dashed #000;margin:8px 0}
    `}</style>
  );
  const caixa = { width: "100%", maxWidth: "72mm", margin: "0 auto", padding: "3mm", fontFamily: "monospace", color: "#000", fontSize: 13 } as const;

  // ---------- Pedido para a cozinha ----------
  if (lancamento) {
    const doPedido = itens.filter((i) => i.lancamento === lancamento && i.status !== "cancelado" && (!setor || i.setor === setor));
    return (
      <main style={caixa}>
        {estilo}
        <div style={{ textAlign: "center", fontSize: 26, fontWeight: "bold" }}>MESA {c.mesa}</div>
        <div style={{ textAlign: "center" }}>
          {setor ? `${setor.toUpperCase()} · ` : ""}
          {doPedido[0] ? new Date(doPedido[0].criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""}
        </div>
        <div style={{ textAlign: "center", fontSize: 12 }}>
          {doPedido[0]?.origem === "qr" ? "Pedido pelo QR da mesa" : `Garçom: ${doPedido[0]?.lancado_por ?? ""}`}
        </div>
        <hr />
        {doPedido.map((i) => (
          <div key={i.id} style={{ marginTop: 8 }}>
            <div style={{ fontSize: 17, fontWeight: "bold" }}>
              {i.quantidade}x {i.nome}
            </div>
            {i.detalhes?.map((d) => (
              <div key={d} style={{ paddingLeft: 10 }}>{d}</div>
            ))}
            {i.observacao && <div style={{ paddingLeft: 10, fontWeight: "bold" }}>OBS: {i.observacao}</div>}
          </div>
        ))}
        {!doPedido.length && <div>Nenhum item.</div>}
        <hr />
        <div style={{ textAlign: "center", fontSize: 11 }}>Comanda {c.numero}</div>
      </main>
    );
  }

  // ---------- Conta da mesa ----------
  // Junta itens iguais (mesmo nome, opções e preço).
  const agrupados = new Map<string, { nome: string; detalhes: string[]; qtd: number; unit: number }>();
  for (const i of itens.filter((x) => x.status !== "cancelado")) {
    const chave = `${i.nome}|${(i.detalhes || []).join(",")}|${i.preco_unit}`;
    const atual = agrupados.get(chave) ?? { nome: i.nome, detalhes: i.detalhes || [], qtd: 0, unit: Number(i.preco_unit) };
    atual.qtd += i.quantidade;
    agrupados.set(chave, atual);
  }
  const fechada = c.status === "fechada";
  const aPagar = Number(c.total) - Number(c.pago_antecipado || 0);

  return (
    <main style={caixa}>
      {estilo}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 18, fontWeight: "bold" }}>{restaurante}</div>
        <div style={{ fontSize: 12 }}>{new Date().toLocaleString("pt-BR")}</div>
      </div>
      <hr />
      <div style={{ textAlign: "center", fontSize: 22, fontWeight: "bold" }}>MESA {c.mesa}</div>
      <div style={{ textAlign: "center" }}>
        {fechada ? "CONTA PAGA" : "CONFERÊNCIA DE CONTA"} · Comanda {c.numero}
      </div>
      {c.garcom_nome && <div style={{ textAlign: "center", fontSize: 12 }}>Garçom: {c.garcom_nome}</div>}
      {c.pessoas ? <div style={{ textAlign: "center", fontSize: 12 }}>{c.pessoas} pessoas</div> : null}
      <hr />
      {[...agrupados.values()].map((i, n) => (
        <div key={n} style={{ marginTop: 6 }}>
          <div style={{ ...linha, fontWeight: "bold" }}>
            <span style={quebra}>
              {i.qtd}x {i.nome}
            </span>
            <span style={valor}>{dinheiro(i.qtd * i.unit)}</span>
          </div>
          {i.detalhes.map((d) => (
            <div key={d} style={{ paddingLeft: 10, fontSize: 12 }}>{d}</div>
          ))}
        </div>
      ))}
      <hr />
      <div style={linha}><span>Consumo</span><span>{dinheiro(c.subtotal)}</span></div>
      {c.taxa_servico && (
        <div style={linha}><span>Serviço ({String(c.taxa_percentual).replace(".", ",")}%)</span><span>{dinheiro(c.taxa_valor)}</span></div>
      )}
      {Number(c.desconto) > 0 && <div style={linha}><span>Desconto</span><span>- {dinheiro(c.desconto)}</span></div>}
      {Number(c.pago_antecipado) > 0 && <div style={linha}><span>Já pago (QR)</span><span>- {dinheiro(c.pago_antecipado)}</span></div>}
      <div style={{ ...linha, fontSize: 18, fontWeight: "bold", marginTop: 4 }}>
        <span>TOTAL</span>
        <span>{dinheiro(aPagar)}</span>
      </div>
      {c.pessoas && c.pessoas > 1 && !fechada ? (
        <div style={{ ...linha, fontSize: 12 }}><span>Por pessoa ({c.pessoas})</span><span>{dinheiro(aPagar / c.pessoas)}</span></div>
      ) : null}
      {!c.taxa_servico && !fechada && (
        <div style={{ fontSize: 11, marginTop: 6 }}>Serviço ({String(c.taxa_percentual).replace(".", ",")}%) opcional: {dinheiro((Number(c.subtotal) * Number(c.taxa_percentual)) / 100)}</div>
      )}
      {fechada && (
        <>
          <hr />
          {(c.pagamentos || []).map((p, n) => (
            <div key={n} style={linha}><span>{NOME_FORMA[p.forma] ?? p.forma}</span><span>{dinheiro(p.valor)}</span></div>
          ))}
          {Number(c.troco) > 0 && <div style={linha}><span>Troco</span><span>{dinheiro(c.troco)}</span></div>}
        </>
      )}
      <hr />
      <div style={{ textAlign: "center", fontSize: 12 }}>{fechada ? "Obrigado pela preferência!" : "Não é documento fiscal"}</div>
    </main>
  );
}
