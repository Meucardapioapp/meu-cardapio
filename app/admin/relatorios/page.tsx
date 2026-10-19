"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/utils/apiFetch";
import { type DadosRelatorio, diaCurto, reais, variacao } from "../components/Relatorio";

const COR = "#6D1F2F";
const PERIODOS = [
  { dias: 1, rotulo: "Hoje" },
  { dias: 7, rotulo: "7 dias" },
  { dias: 30, rotulo: "30 dias" },
  { dias: 90, rotulo: "90 dias" },
];

function Cartao({ titulo, valor, atual, anterior, dinheiro = false }: { titulo: string; valor: string; atual: number; anterior: number; dinheiro?: boolean }) {
  const v = variacao(atual, anterior);
  return (
    <div className="rounded-2xl bg-white border p-4">
      <p className="text-sm text-zinc-500">{titulo}</p>
      <p className="mt-1 text-2xl font-black text-zinc-900">{valor}</p>
      {v && (
        <p className={`mt-1 text-xs font-semibold ${v.positiva ? "text-green-700" : "text-red-600"}`}>
          {v.texto} <span className="font-normal text-zinc-500">vs. período anterior ({dinheiro ? reais(anterior) : anterior})</span>
        </p>
      )}
    </div>
  );
}

export default function RelatoriosPage() {
  const [dias, setDias] = useState(7);
  const [dados, setDados] = useState<DadosRelatorio | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [baixando, setBaixando] = useState(false);

  useEffect(() => {
    setCarregando(true);
    apiFetch(`/api/painel/relatorios?dias=${dias}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d?.success) toast.error(d?.error || "Não foi possível carregar o relatório.");
        else setDados(d);
      })
      .finally(() => setCarregando(false));
  }, [dias]);

  async function baixarPlanilha() {
    setBaixando(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const resposta = await fetch(`/api/painel/relatorios?dias=${dias}&formato=csv`, {
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
      });
      if (!resposta.ok) throw new Error();
      const blob = await resposta.blob();
      const nome = /filename="([^"]+)"/.exec(resposta.headers.get("content-disposition") || "")?.[1] || "vendas.csv";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nome;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Não foi possível baixar a planilha.");
    } finally {
      setBaixando(false);
    }
  }

  const r = dados?.resumo;
  const a = dados?.anterior;
  const maxProduto = Math.max(1, ...(dados?.produtos ?? []).map((p) => p.quantidade));
  const totalPagamento = (dados?.porPagamento ?? []).reduce((s, p) => s + p.valor, 0) || 1;
  const maxHora = Math.max(1, ...(dados?.porHora ?? [0]));
  const horaPico = dados ? dados.porHora.indexOf(Math.max(...dados.porHora)) : -1;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">Relatórios</h1>
          <p className="text-sm text-zinc-500 mt-1">Quanto você vendeu, o que mais sai e em que horário.</p>
        </div>
        <button
          onClick={baixarPlanilha}
          disabled={baixando || !dados}
          className="h-11 px-4 rounded-xl border bg-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {baixando ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Baixar planilha (Excel)
        </button>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide">
        {PERIODOS.map((p) => (
          <button
            key={p.dias}
            onClick={() => setDias(p.dias)}
            className={`h-10 px-4 rounded-full text-sm font-semibold whitespace-nowrap ${
              dias === p.dias ? "bg-[#6D1F2F] text-white" : "bg-white border text-zinc-700"
            }`}
          >
            {p.rotulo}
          </button>
        ))}
      </div>

      {carregando && !dados && (
        <div className="py-20 flex justify-center">
          <Loader2 className="animate-spin text-zinc-400" />
        </div>
      )}

      {dados && r && a && (
        <div className={`transition-opacity ${carregando ? "opacity-50" : ""}`}>
          <div className="mt-5 grid gap-3 grid-cols-2 lg:grid-cols-4">
            <Cartao titulo="Faturamento" valor={reais(r.faturamento)} atual={r.faturamento} anterior={a.faturamento} dinheiro />
            <Cartao titulo="Pedidos" valor={String(r.pedidos)} atual={r.pedidos} anterior={a.pedidos} />
            <Cartao titulo="Ticket médio" valor={reais(r.ticketMedio)} atual={r.ticketMedio} anterior={a.ticketMedio} dinheiro />
            <Cartao titulo="Clientes atendidos" valor={String(r.clientes)} atual={r.clientes} anterior={a.clientes} />
          </div>

          {dados.salao && dados.salao.contas > 0 && (
            <div className="mt-3 rounded-2xl border bg-white p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-bold text-zinc-900">🍽️ Salão (mesas)</p>
                <a href="/admin/salao/relatorio" className="text-sm font-semibold text-[#6D1F2F] underline">Ver desempenho da equipe</a>
              </div>
              <div className="mt-3 grid gap-3 grid-cols-2 lg:grid-cols-4">
                <div><p className="text-xs text-zinc-500">Vendas no salão</p><p className="text-xl font-black">{reais(dados.salao.faturamento)}</p></div>
                <div><p className="text-xs text-zinc-500">Contas fechadas</p><p className="text-xl font-black">{dados.salao.contas}</p></div>
                <div><p className="text-xs text-zinc-500">Taxa de serviço (10%)</p><p className="text-xl font-black">{reais(dados.salao.taxaServico)}</p></div>
                <div><p className="text-xs text-zinc-500">Total delivery + salão</p><p className="text-xl font-black">{reais(r.faturamento + dados.salao.faturamento)}</p></div>
              </div>
              {dados.salao.porPagamento.length > 0 && (
                <p className="mt-3 text-sm text-zinc-600">
                  {dados.salao.porPagamento.map((p) => `${p.nome}: ${reais(p.valor)}`).join(" · ")}
                </p>
              )}
            </div>
          )}

          {dados.porDia.length > 1 && (
            <div className="mt-5 rounded-2xl bg-white border p-4">
              <p className="font-bold text-zinc-900">Faturamento por dia</p>
              <div className="mt-3 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dados.porDia} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#EFEDEE" />
                    <XAxis dataKey="dia" tickFormatter={diaCurto} tick={{ fontSize: 11, fill: "#71717A" }} tickLine={false} axisLine={false} minTickGap={12} />
                    <YAxis tickFormatter={(v) => `R$${Math.round(v)}`} tick={{ fontSize: 11, fill: "#71717A" }} tickLine={false} axisLine={false} width={56} />
                    <Tooltip
                      cursor={{ fill: "rgba(109,31,47,0.06)" }}
                      formatter={(v: any) => [reais(Number(v)), "Faturamento"]}
                      labelFormatter={(l: any) => diaCurto(String(l))}
                    />
                    <Bar dataKey="faturamento" fill={COR} radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl bg-white border p-4">
              <p className="font-bold text-zinc-900">Produtos mais vendidos</p>
              {dados.produtos.length === 0 && <p className="mt-3 text-sm text-zinc-500">Nenhuma venda no período.</p>}
              <div className="mt-3 space-y-2">
                {dados.produtos.map((p) => (
                  <div key={p.nome}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-zinc-800 truncate pr-2">{p.nome}</span>
                      <span className="text-zinc-600 shrink-0">{p.quantidade} un. · {reais(p.receita)}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-zinc-100">
                      <div className="h-2 rounded-full" style={{ width: `${(p.quantidade / maxProduto) * 100}%`, backgroundColor: COR }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl bg-white border p-4">
                <p className="font-bold text-zinc-900">Como os clientes pagaram</p>
                <div className="mt-3 space-y-2">
                  {dados.porPagamento.map((p) => (
                    <div key={p.nome}>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-800">{p.nome}</span>
                        <span className="text-zinc-600">{reais(p.valor)} · {Math.round((p.valor / totalPagamento) * 100)}%</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-zinc-100">
                        <div className="h-2 rounded-full" style={{ width: `${(p.valor / totalPagamento) * 100}%`, backgroundColor: COR }} />
                      </div>
                    </div>
                  ))}
                  {dados.porPagamento.length === 0 && <p className="text-sm text-zinc-500">Nenhuma venda no período.</p>}
                </div>
              </div>

              <div className="rounded-2xl bg-white border p-4">
                <p className="font-bold text-zinc-900">Horário dos pedidos</p>
                {horaPico >= 0 && r.pedidos > 0 && (
                  <p className="text-sm text-zinc-500">Pico: {horaPico}h às {horaPico + 1}h</p>
                )}
                <div className="mt-3 flex items-end gap-[2px] h-24" role="img" aria-label="Pedidos por hora do dia">
                  {dados.porHora.map((n, h) => (
                    <div key={h} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      <div
                        className="w-full rounded-t"
                        style={{ height: `${(n / maxHora) * 100}%`, minHeight: n ? 3 : 0, backgroundColor: h === horaPico ? COR : "#C9A9B0" }}
                        title={`${h}h: ${n} pedido(s)`}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
                  <span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs text-zinc-500">
            Conta pedidos em dinheiro, cartão e Pix pago. Pedidos recusados ou cancelados ficam de fora ({r.cancelados} no período).
            {r.descontos > 0 ? ` Descontos dados (cupom e fidelidade): ${reais(r.descontos)}.` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
