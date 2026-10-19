"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/utils/apiFetch";
import { NOME_FORMA, reais } from "@/app/components/salao/comum";

type Pessoa = {
  id: string;
  nome: string;
  funcao: "garcom" | "cozinha" | "motoboy";
  setor: string | null;
  ativo: boolean;
  mesas?: number;
  pedidos?: number;
  itens?: number;
  comDez?: number;
  dez?: number;
  vendido?: number;
  tempoMedio?: number | null;
  entregas?: number;
  taxas?: number;
};
type Dados = {
  salao: { contas: number; vendido: number; consumo: number; taxaServico: number; descontos: number; comDez: number; pessoas: number; formas: Record<string, number> };
  delivery: { pedidos: number; vendido: number };
  equipe: Pessoa[];
  outros: { mesas: number; dez: number; vendido: number };
};

const PERIODOS = [
  { id: "hoje", nome: "Hoje" },
  { id: "ontem", nome: "Ontem" },
  { id: "7", nome: "7 dias" },
  { id: "30", nome: "30 dias" },
] as const;

function intervalo(p: (typeof PERIODOS)[number]["id"]) {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date();
  if (p === "ontem") {
    inicio.setDate(inicio.getDate() - 1);
    fim.setTime(inicio.getTime() + 86400000 - 1);
  } else if (p !== "hoje") inicio.setDate(inicio.getDate() - (Number(p) - 1));
  return { desde: inicio.toISOString(), ate: fim.toISOString() };
}

/** Relatório do salão e desempenho de cada pessoa da equipe. */
export default function RelatorioEquipePage() {
  const [periodo, setPeriodo] = useState<(typeof PERIODOS)[number]["id"]>("hoje");
  const [dados, setDados] = useState<Dados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    setCarregando(true);
    const { desde, ate } = intervalo(periodo);
    apiFetch(`/api/salao/relatorio?desde=${encodeURIComponent(desde)}&ate=${encodeURIComponent(ate)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.success) {
          setDados(d);
          setErro("");
        } else setErro(d?.error || "Não foi possível carregar.");
      })
      .finally(() => setCarregando(false));
  }, [periodo]);

  const s = dados?.salao;
  const garcons = dados?.equipe.filter((p) => p.funcao === "garcom") ?? [];
  const cozinha = dados?.equipe.filter((p) => p.funcao === "cozinha") ?? [];
  const motoboys = dados?.equipe.filter((p) => p.funcao === "motoboy") ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-black text-zinc-900 sm:text-3xl">Relatório da equipe</h1>
      <p className="mt-1 text-sm text-zinc-500">Vendas no salão e o desempenho de cada garçom, da cozinha e dos motoboys.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {PERIODOS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriodo(p.id)}
            className={`h-10 rounded-full px-4 text-sm font-semibold ${periodo === p.id ? "bg-[#6D1F2F] text-white" : "border bg-white text-zinc-700"}`}
          >
            {p.nome}
          </button>
        ))}
      </div>

      {erro && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{erro}</div>}
      {carregando && !dados && (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-zinc-400" /></div>
      )}

      {dados && s && (
        <div className={carregando ? "opacity-50 transition-opacity" : "transition-opacity"}>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["Vendas no salão", reais(s.vendido)],
              ["Contas fechadas", String(s.contas)],
              ["Ticket médio", reais(s.contas ? s.vendido / s.contas : 0)],
              ["Taxa de serviço", reais(s.taxaServico)],
            ].map(([t, v]) => (
              <div key={t} className="rounded-2xl border bg-white p-4">
                <p className="text-sm text-zinc-500">{t}</p>
                <p className="mt-1 text-2xl font-black">{v}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-4">
              <p className="font-bold">Como pagaram (salão)</p>
              <div className="mt-2 space-y-1 text-sm">
                {Object.entries(s.formas).length === 0 && <p className="text-zinc-500">Nenhuma conta fechada.</p>}
                {Object.entries(s.formas)
                  .sort((a, b) => b[1] - a[1])
                  .map(([f, v]) => (
                    <div key={f} className="flex justify-between">
                      <span>{NOME_FORMA[f] ?? f}</span>
                      <span className="font-semibold">{reais(v)}</span>
                    </div>
                  ))}
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                {s.comDez} de {s.contas} contas pagaram a taxa de serviço
                {s.descontos > 0 ? ` · ${reais(s.descontos)} em descontos` : ""}
                {s.pessoas > 0 ? ` · ${s.pessoas} pessoas atendidas` : ""}
              </p>
            </div>
            <div className="rounded-2xl border bg-white p-4">
              <p className="font-bold">Movimento total</p>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between"><span>Salão ({s.contas} contas)</span><span className="font-semibold">{reais(s.vendido)}</span></div>
                <div className="flex justify-between"><span>Delivery ({dados.delivery.pedidos} pedidos concluídos)</span><span className="font-semibold">{reais(dados.delivery.vendido)}</span></div>
                <div className="flex justify-between border-t pt-1 text-base font-black"><span>Total</span><span>{reais(s.vendido + dados.delivery.vendido)}</span></div>
              </div>
            </div>
          </div>

          <Tabela
            titulo="🧑‍🍳 Garçons"
            vazio="Cadastre garçons em Equipe."
            colunas={["Mesas", "Pedidos", "Itens", "Com 10%", "Ganhou de 10%", "Vendido"]}
            linhas={[
              ...garcons.map((p) => ({
                nome: p.nome,
                inativo: !p.ativo,
                valores: [String(p.mesas ?? 0), String(p.pedidos ?? 0), String(p.itens ?? 0), String(p.comDez ?? 0), reais(p.dez ?? 0), reais(p.vendido ?? 0)],
              })),
              ...(dados.outros.mesas
                ? [{ nome: "Caixa / QR da mesa", inativo: true, valores: [String(dados.outros.mesas), "–", "–", "–", reais(dados.outros.dez), reais(dados.outros.vendido)] }]
                : []),
            ]}
          />
          <Tabela
            titulo="🔥 Cozinha"
            vazio="Cadastre o pessoal da cozinha em Equipe."
            colunas={["Setor", "Itens preparados", "Tempo médio"]}
            linhas={cozinha.map((p) => ({
              nome: p.nome,
              inativo: !p.ativo,
              valores: [p.setor && p.setor !== "Todos" ? p.setor : "Todos", String(p.itens ?? 0), p.tempoMedio != null ? `${p.tempoMedio} min` : "–"],
            }))}
          />
          <Tabela
            titulo="🛵 Motoboys"
            vazio="Cadastre motoboys em Equipe."
            colunas={["Entregas", "Taxas de entrega"]}
            linhas={motoboys.map((p) => ({ nome: p.nome, inativo: !p.ativo, valores: [String(p.entregas ?? 0), reais(p.taxas ?? 0)] }))}
          />
        </div>
      )}
    </div>
  );
}

function Tabela({ titulo, colunas, linhas, vazio }: { titulo: string; colunas: string[]; linhas: { nome: string; inativo: boolean; valores: string[] }[]; vazio: string }) {
  return (
    <div className="mt-5 overflow-hidden rounded-2xl border bg-white">
      <p className="border-b px-4 py-3 font-bold">{titulo}</p>
      {!linhas.length ? (
        <p className="p-4 text-sm text-zinc-500">{vazio}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-500">
                <th className="px-4 py-2 font-semibold">Nome</th>
                {colunas.map((c) => (
                  <th key={c} className="px-3 py-2 text-right font-semibold">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {linhas.map((l) => (
                <tr key={l.nome} className={l.inativo ? "text-zinc-400" : ""}>
                  <td className="px-4 py-2.5 font-semibold">{l.nome}</td>
                  {l.valores.map((v, i) => (
                    <td key={i} className="px-3 py-2.5 text-right">{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
