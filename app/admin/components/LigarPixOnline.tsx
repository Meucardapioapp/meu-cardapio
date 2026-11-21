"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/utils/apiFetch";

/**
 * Liga/desliga o Pix online no cardápio, sem apagar os dados bancários.
 * Desligado, o cliente só vê as outras formas (dinheiro, cartão, Pix na chave).
 */
export default function LigarPixOnline({ className = "" }: { className?: string }) {
  const [ligado, setLigado] = useState<boolean | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    apiFetch("/api/painel/formas-pedido")
      .then((r) => r.json())
      .then((d) => setLigado(d?.success ? d.pix_online !== false : true))
      .catch(() => setLigado(true));
  }, []);

  async function mudar() {
    if (ligado === null || salvando) return;
    const novo = !ligado;
    setSalvando(true);
    try {
      const r = await apiFetch("/api/painel/formas-pedido", {
        method: "POST",
        body: JSON.stringify({ campo: "pix_online", ativo: novo }),
      });
      const d = await r.json().catch(() => null);
      if (!r.ok || !d?.success) throw new Error(d?.error || "Não foi possível alterar.");
      setLigado(novo);
      toast.success(novo ? "Pix online ligado: aparece no seu cardápio." : "Pix online desligado: não aparece mais no cardápio.");
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível alterar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className={`flex items-center gap-3 rounded-2xl border p-4 ${ligado === false ? "border-zinc-200 bg-zinc-50" : "border-green-200 bg-green-50/60"} ${className}`}>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-zinc-900">Pix online no cardápio</p>
        <p className="text-sm text-zinc-600">
          {ligado === null
            ? "Carregando…"
            : ligado
            ? "Ligado: seus clientes podem pagar com Pix online."
            : "Desligado: o cardápio mostra só as outras formas de pagamento. Seus dados bancários continuam salvos."}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={Boolean(ligado)}
        aria-label="Pix online no cardápio"
        disabled={ligado === null || salvando}
        onClick={mudar}
        className={`relative w-14 h-8 shrink-0 rounded-full transition disabled:opacity-50 ${ligado ? "bg-green-600" : "bg-zinc-300"}`}
      >
        <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${ligado ? "left-7" : "left-1"}`} />
      </button>
    </div>
  );
}
