"use client";

import { useState } from "react";
import { Loader2, Minus, Plus, Users, X } from "lucide-react";

const COR = "#6D1F2F";

/** Abrir mesa: número + pessoas (opcional). Usado pelo garçom e pelo caixa. */
export default function AbrirMesa({ onFechar, onAbrir }: { onFechar: () => void; onAbrir: (mesa: string, pessoas: number | null) => Promise<boolean> }) {
  const [mesa, setMesa] = useState("");
  const [pessoas, setPessoas] = useState(0);
  const [enviando, setEnviando] = useState(false);

  async function confirmar() {
    if (!mesa.trim()) return;
    setEnviando(true);
    try {
      await onAbrir(mesa.trim(), pessoas || null);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-6" onClick={onFechar}>
      <div onClick={(e) => e.stopPropagation()} className="w-full rounded-t-3xl bg-white p-5 sm:max-w-sm sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <p className="text-xl font-black">Abrir mesa</p>
          <button onClick={onFechar} aria-label="Fechar" className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100">
            <X size={18} />
          </button>
        </div>
        <input
          autoFocus
          value={mesa}
          onChange={(e) => setMesa(e.target.value.slice(0, 12))}
          onKeyDown={(e) => e.key === "Enter" && confirmar()}
          inputMode="numeric"
          placeholder="Número da mesa"
          className="mt-4 h-16 w-full rounded-2xl border-2 px-4 text-center text-3xl font-black"
        />
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-zinc-50 p-2">
          <span className="flex items-center gap-2 pl-2 text-sm font-semibold text-zinc-600">
            <Users size={18} /> Pessoas (opcional)
          </span>
          <div className="flex items-center">
            <button onClick={() => setPessoas((p) => Math.max(0, p - 1))} aria-label="Menos" className="flex h-11 w-11 items-center justify-center rounded-xl bg-white">
              <Minus size={18} />
            </button>
            <span className="w-8 text-center text-lg font-black">{pessoas || "–"}</span>
            <button onClick={() => setPessoas((p) => Math.min(50, p + 1))} aria-label="Mais" className="flex h-11 w-11 items-center justify-center rounded-xl bg-white">
              <Plus size={18} />
            </button>
          </div>
        </div>
        <button
          disabled={!mesa.trim() || enviando}
          onClick={confirmar}
          className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-xl text-lg font-black text-white disabled:opacity-50"
          style={{ backgroundColor: COR }}
        >
          {enviando && <Loader2 className="animate-spin" />} Abrir e anotar pedido
        </button>
      </div>
    </div>
  );
}

