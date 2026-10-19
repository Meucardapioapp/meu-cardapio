"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/utils/apiFetch";

/** Termos e Privacidade atualizados: o dono confirma uma vez para continuar. */
export default function AceiteTermos({ onAceito }: { onAceito: () => void }) {
  const [marcado, setMarcado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function aceitar() {
    setEnviando(true);
    try {
      const d = await apiFetch("/api/painel/termos", { method: "POST" }).then((r) => r.json());
      if (!d?.success) return toast.error(d?.error || "Não foi possível salvar.");
      onAceito();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6">
        <p className="text-xl font-black">Atualizamos os Termos de Uso</p>
        <p className="mt-2 text-sm text-zinc-600">
          Incluímos as regras do salão (garçons, cozinha e motoboys), da proteção de dados dos seus clientes e da sua
          equipe (LGPD) e do cancelamento do plano. Leia antes de continuar:
        </p>
        <div className="mt-3 flex gap-4 text-sm font-semibold">
          <a href="/termos" target="_blank" rel="noreferrer" className="text-[#6D1F2F] underline">Termos de Uso</a>
          <a href="/privacidade" target="_blank" rel="noreferrer" className="text-[#6D1F2F] underline">Política de Privacidade</a>
        </div>
        <label className="mt-4 flex items-start gap-3 rounded-xl bg-zinc-50 p-3 text-sm">
          <input type="checkbox" checked={marcado} onChange={(e) => setMarcado(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0" />
          Li e concordo com os Termos de Uso e a Política de Privacidade.
        </label>
        <button
          disabled={!marcado || enviando}
          onClick={aceitar}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6D1F2F] font-bold text-white disabled:opacity-50"
        >
          {enviando && <Loader2 size={18} className="animate-spin" />} Continuar
        </button>
      </div>
    </div>
  );
}
