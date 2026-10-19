"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, Gift, Loader2, MessageCircle, Search } from "lucide-react";
import { apiFetch } from "@/utils/apiFetch";
import type { ProgramaFidelidade } from "@/lib/fidelidade";

type Cliente = {
  id: string;
  nome: string | null;
  telefone: string | null;
  pedidos: number;
  total_gasto: number;
  ultimo_pedido: string | null;
  selos: number;
};

const reais = (v: number) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function linkWhatsApp(telefone: string | null) {
  let t = String(telefone || "").replace(/\D/g, "");
  if (t && !t.startsWith("55")) t = `55${t}`;
  return `https://wa.me/${t}`;
}

export default function ClientesPage() {
  const [carregando, setCarregando] = useState(true);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [programa, setPrograma] = useState<ProgramaFidelidade | null>(null);
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<"gasto" | "pedidos" | "nome" | "recentes">("gasto");

  useEffect(() => {
    Promise.all([
      apiFetch("/api/painel/clientes").then((r) => r.json()),
      apiFetch("/api/painel/fidelidade").then((r) => r.json()).catch(() => null),
    ])
      .then(([c, f]) => {
        if (!c?.success) toast.error("Erro ao carregar clientes.");
        setClientes(c?.clientes || []);
        setPrograma(f?.programa ?? null);
      })
      .finally(() => setCarregando(false));
  }, []);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const filtrados = clientes.filter(
      (c) => !termo || `${c.nome ?? ""} ${c.telefone ?? ""}`.toLowerCase().includes(termo)
    );
    return [...filtrados].sort((a, b) => {
      if (ordem === "nome") return String(a.nome).localeCompare(String(b.nome));
      if (ordem === "pedidos") return b.pedidos - a.pedidos;
      if (ordem === "recentes") return String(b.ultimo_pedido ?? "").localeCompare(String(a.ultimo_pedido ?? ""));
      return b.total_gasto - a.total_gasto;
    });
  }, [clientes, busca, ordem]);

  const totalGasto = clientes.reduce((s, c) => s + c.total_gasto, 0);
  const necessarios = programa?.pedidosNecessarios ?? 10;
  const programaLigado = Boolean(programa?.ativo);

  if (carregando) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">Clientes</h1>
      <p className="text-sm text-zinc-500 mt-1">
        {clientes.length} clientes · {reais(totalGasto)} em pedidos (Pix, dinheiro e cartão)
      </p>

      <Link
        href="/admin/fidelidade"
        className="mt-4 flex items-center gap-3 rounded-2xl bg-white border p-4"
      >
        <span className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <Gift size={22} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-bold text-zinc-900">
            Programa de fidelidade {programaLigado ? "ligado" : "desligado"}
          </span>
          <span className="block text-sm text-zinc-500">
            {programaLigado
              ? `A cada ${necessarios} pedidos o cliente ganha ${programa?.textoPremio}.`
              : "Ligue para seus clientes voltarem a pedir mais vezes."}
          </span>
        </span>
        <ArrowRight size={18} className="text-zinc-400" />
      </Link>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_200px]">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar nome ou telefone"
            className="w-full h-11 rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-base"
          />
        </div>
        <select
          value={ordem}
          onChange={(e) => setOrdem(e.target.value as typeof ordem)}
          className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-base"
        >
          <option value="gasto">Quem mais gastou</option>
          <option value="pedidos">Mais pedidos</option>
          <option value="recentes">Pediu por último</option>
          <option value="nome">Nome (A-Z)</option>
        </select>
      </div>

      {lista.length === 0 && (
        <div className="mt-6 rounded-2xl bg-white border p-8 text-center text-zinc-500">
          Nenhum cliente encontrado.
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {lista.map((c) => {
          const selosNoCiclo = Math.min(c.selos, necessarios);
          const temPremio = programaLigado && c.selos >= necessarios;

          return (
            <div key={c.id} className="rounded-2xl bg-white border p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#7A1F3D] to-[#A52A53] text-white font-bold flex items-center justify-center shrink-0">
                  {(c.nome || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-zinc-900 truncate">{c.nome || "Sem nome"}</p>
                  <p className="text-sm text-zinc-500">{c.telefone}</p>
                </div>
                {c.telefone && (
                  <a
                    href={linkWhatsApp(c.telefone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`WhatsApp de ${c.nome}`}
                    className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0"
                  >
                    <MessageCircle size={18} />
                  </a>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-zinc-50 py-2">
                  <p className="text-lg font-black">{c.pedidos}</p>
                  <p className="text-[11px] text-zinc-500">pedidos</p>
                </div>
                <div className="rounded-xl bg-zinc-50 py-2">
                  <p className="text-lg font-black text-emerald-700">{reais(c.total_gasto)}</p>
                  <p className="text-[11px] text-zinc-500">total gasto</p>
                </div>
              </div>

              {programaLigado && (
                <div className="mt-3">
                  <div className="h-2.5 rounded-full bg-zinc-200 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${(selosNoCiclo / necessarios) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 flex justify-between">
                    <span>{selosNoCiclo}/{necessarios} selos</span>
                    {temPremio && <span className="font-bold text-emerald-700">🎁 Prêmio liberado</span>}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
