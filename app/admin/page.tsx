"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, ClipboardList, Link2, Palette } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { apiFetch } from "@/utils/apiFetch";
import { type DadosRelatorio, diaCurto, reais, variacao } from "./components/Relatorio";

const COR = "#6D1F2F";

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

function Numero({ titulo, valor, atual, anterior, rodape }: { titulo: string; valor: string; atual?: number; anterior?: number; rodape?: string }) {
  const v = atual != null && anterior != null ? variacao(atual, anterior) : null;
  return (
    <div className="rounded-2xl bg-white border p-4">
      <p className="text-sm text-zinc-500">{titulo}</p>
      <p className="mt-1 text-2xl font-black text-zinc-900">{valor}</p>
      {v ? (
        <p className={`mt-1 text-xs font-semibold ${v.positiva ? "text-green-700" : "text-red-600"}`}>
          {v.texto} <span className="font-normal text-zinc-500">vs. ontem</span>
        </p>
      ) : rodape ? (
        <p className="mt-1 text-xs text-zinc-500">{rodape}</p>
      ) : null}
    </div>
  );
}

/** Início do painel: o dia de hoje comparado com ontem, em um olhar. */
export default function InicioPage() {
  const [dados, setDados] = useState<DadosRelatorio | null>(null);
  const [pendentes, setPendentes] = useState<number | null>(null);

  useEffect(() => {
    apiFetch("/api/painel/relatorios?dias=7")
      .then((r) => r.json())
      .then((d) => d?.success && setDados(d))
      .catch(() => {});
    apiFetch("/api/painel/pendentes")
      .then((r) => r.json())
      .then((d) => setPendentes((d?.pedidos ?? []).length))
      .catch(() => {});
  }, []);

  const dias = dados?.porDia ?? [];
  const hoje = dias[dias.length - 1] ?? { pedidos: 0, faturamento: 0, dia: "" };
  const ontem = dias[dias.length - 2] ?? { pedidos: 0, faturamento: 0, dia: "" };
  const ticketHoje = hoje.pedidos ? hoje.faturamento / hoje.pedidos : 0;
  const ticketOntem = ontem.pedidos ? ontem.faturamento / ontem.pedidos : 0;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">{saudacao()} 👋</h1>
      <p className="text-sm text-zinc-500 mt-1">Como está o seu dia hoje.</p>

      {pendentes != null && pendentes > 0 && (
        <Link
          href="/admin/pedidos"
          className="mt-4 flex items-center gap-3 rounded-2xl bg-amber-500 text-white p-4 font-bold"
        >
          <ClipboardList size={22} />
          <span className="flex-1">
            {pendentes === 1 ? "1 pedido esperando você aceitar" : `${pendentes} pedidos esperando você aceitar`}
          </span>
          <ArrowRight size={20} />
        </Link>
      )}

      <div className="mt-4 grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Numero titulo="Vendas hoje" valor={dados ? reais(hoje.faturamento) : "—"} atual={dados ? hoje.faturamento : undefined} anterior={dados ? ontem.faturamento : undefined} />
        <Numero titulo="Pedidos hoje" valor={dados ? String(hoje.pedidos) : "—"} atual={dados ? hoje.pedidos : undefined} anterior={dados ? ontem.pedidos : undefined} />
        <Numero titulo="Ticket médio hoje" valor={dados ? reais(ticketHoje) : "—"} atual={dados && hoje.pedidos ? ticketHoje : undefined} anterior={dados && hoje.pedidos ? ticketOntem : undefined} rodape="Valor médio por pedido" />
        <Numero titulo="Últimos 7 dias" valor={dados ? reais(dados.resumo.faturamento) : "—"} rodape={dados ? `${dados.resumo.pedidos} pedidos` : undefined} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="rounded-2xl bg-white border p-4">
          <div className="flex items-center justify-between">
            <p className="font-bold text-zinc-900">Vendas da semana</p>
            <Link href="/admin/relatorios" className="text-sm font-semibold text-[#6D1F2F]">Ver relatório</Link>
          </div>
          <div className="mt-3 h-52">
            {dados && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dias} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                  <XAxis dataKey="dia" tickFormatter={diaCurto} tick={{ fontSize: 11, fill: "#71717A" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(109,31,47,0.06)" }}
                    formatter={(v: any) => [reais(Number(v)), "Vendas"]}
                    labelFormatter={(l: any) => diaCurto(String(l))}
                  />
                  <Bar dataKey="faturamento" fill={COR} radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white border p-4">
          <p className="font-bold text-zinc-900">Mais vendidos da semana</p>
          <ol className="mt-3 space-y-2 text-sm">
            {(dados?.produtos ?? []).slice(0, 5).map((p, i) => (
              <li key={p.nome} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-zinc-100 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <span className="flex-1 truncate">{p.nome}</span>
                <span className="text-zinc-500">{p.quantidade} un.</span>
              </li>
            ))}
            {dados && dados.produtos.length === 0 && <li className="text-zinc-500">Ainda sem vendas nesta semana.</li>}
          </ol>
        </div>
      </div>

      <div className="mt-5 grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/admin/pedidos", icone: ClipboardList, titulo: "Pedidos", texto: "Aceitar e acompanhar" },
          { href: "/admin/aparencia", icone: Palette, titulo: "Editar Cardápio", texto: "Logo, banner e cores" },
          { href: "/admin/relatorios", icone: BarChart3, titulo: "Relatórios", texto: "Vendas e planilha" },
          { href: "/admin/link-cardapio", icone: Link2, titulo: "Link e QR Code", texto: "Divulgar o cardápio" },
        ].map(({ href, icone: Icone, titulo, texto }) => (
          <Link key={href} href={href} className="rounded-2xl bg-white border p-4 hover:shadow-md transition">
            <Icone size={22} className="text-[#6D1F2F]" />
            <p className="mt-2 font-bold text-zinc-900">{titulo}</p>
            <p className="text-sm text-zinc-500">{texto}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
