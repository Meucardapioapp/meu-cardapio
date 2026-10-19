"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Clock3, Loader2 } from "lucide-react";
import { apiFetch } from "@/utils/apiFetch";

const num = (v: string) => (v.trim() === "" ? null : Math.max(0, Math.min(600, Math.floor(Number(v) || 0))));

/** Tempo médio de entrega e de retirada (aparece no cardápio para o cliente). */
export default function TemposEntrega() {
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [retirada, setRetirada] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    apiFetch("/api/painel/operacao")
      .then((r) => r.json())
      .then((d) => {
        const o = d?.operacao;
        if (!o) return;
        setMin(o.tempoEntregaMin != null ? String(o.tempoEntregaMin) : "");
        setMax(o.tempoEntregaMax != null ? String(o.tempoEntregaMax) : "");
        setRetirada(o.tempoRetirada != null ? String(o.tempoRetirada) : "");
      })
      .catch(() => {});
  }, []);

  async function salvar() {
    setSalvando(true);
    try {
      const d = await apiFetch("/api/painel/operacao", {
        method: "PUT",
        body: JSON.stringify({ acao: "tempos", entregaMin: num(min), entregaMax: num(max), retirada: num(retirada) }),
      }).then((r) => r.json());
      if (!d?.success) return toast.error(d?.error || "Não foi possível salvar.");
      toast.success("Tempos salvos. Já aparecem no cardápio.");
    } finally {
      setSalvando(false);
    }
  }

  const campo = (valor: string, set: (v: string) => void, rotulo: string) => (
    <label className="block">
      <span className="text-xs font-semibold text-zinc-600">{rotulo}</span>
      <div className="mt-1 flex items-center gap-2 h-12 rounded-xl border bg-white px-3">
        <input
          value={valor}
          onChange={(e) => set(e.target.value.replace(/\D/g, "").slice(0, 3))}
          inputMode="numeric"
          className="w-full text-base font-semibold outline-none"
          placeholder="—"
        />
        <span className="text-sm text-zinc-500">min</span>
      </div>
    </label>
  );

  return (
    <div className="rounded-2xl bg-white border p-5 mb-6">
      <div className="flex items-center gap-2">
        <Clock3 size={20} className="text-[#6D1F2F]" />
        <p className="font-bold text-zinc-900">Tempo de entrega e retirada</p>
      </div>
      <p className="text-sm text-zinc-500 mt-1">O cliente vê no cardápio. Deixe em branco para não mostrar.</p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {campo(min, setMin, "Entrega: de")}
        {campo(max, setMax, "até")}
        {campo(retirada, setRetirada, "Retirada")}
      </div>
      <button
        onClick={salvar}
        disabled={salvando}
        className="mt-4 h-11 px-5 rounded-xl bg-[#6D1F2F] text-white font-bold flex items-center gap-2 disabled:opacity-60"
      >
        {salvando && <Loader2 size={16} className="animate-spin" />}
        Salvar tempos
      </button>
    </div>
  );
}
