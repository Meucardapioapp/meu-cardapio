"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { liberarSom } from "@/lib/alerta-sonoro";

const COR = "#6D1F2F";

function formatarCelular(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/**
 * Entrada da equipe (garçom, cozinha, motoboy): celular + PIN.
 * Depois de entrar, cada um vai para o seu app.
 */
export default function EntrarEquipe({
  titulo = "Equipe",
  emoji = "👋",
  paginaAtual,
  onEntrou,
}: {
  titulo?: string;
  emoji?: string;
  paginaAtual?: string;
  onEntrou?: () => void;
}) {
  const [telefone, setTelefone] = useState("");
  const [pin, setPin] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    liberarSom();
    try {
      const r = await fetch("/api/equipe-app/entrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone, pin }),
      });
      const d = await r.json().catch(() => null);
      if (!d?.success) {
        toast.error(d?.error || "Não foi possível entrar.");
        return;
      }
      if (paginaAtual && d.pagina !== paginaAtual && !(d.funcoes || []).some((f: string) => paginaDe(f) === paginaAtual)) {
        window.location.href = d.pagina;
        return;
      }
      if (!paginaAtual) {
        window.location.href = d.pagina;
        return;
      }
      onEntrou?.();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-dvh bg-zinc-50 flex items-center justify-center p-5">
      <form onSubmit={entrar} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-sm border">
        <p className="text-4xl">{emoji}</p>
        <h1 className="text-2xl font-black mt-2">{titulo}</h1>
        <p className="text-sm text-zinc-500 mt-1">Entre com o celular e o PIN que o restaurante te passou.</p>

        <label className="block mt-5 text-sm font-semibold">
          Celular
          <input
            value={telefone}
            onChange={(e) => setTelefone(formatarCelular(e.target.value))}
            inputMode="tel"
            autoComplete="tel"
            placeholder="(65) 99999-9999"
            className="mt-1 w-full h-14 rounded-xl border px-4 text-lg font-normal"
          />
        </label>

        <label className="block mt-3 text-sm font-semibold">
          PIN
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            autoComplete="one-time-code"
            type="password"
            placeholder="••••"
            className="mt-1 w-full h-14 rounded-xl border px-4 text-2xl tracking-[0.5em] font-normal"
          />
        </label>

        <button
          disabled={enviando || telefone.replace(/\D/g, "").length < 10 || pin.length !== 4}
          className="mt-5 w-full h-14 rounded-xl text-white text-lg font-black flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: COR }}
        >
          {enviando && <Loader2 className="animate-spin" />} Entrar
        </button>
        <p className="text-xs text-zinc-400 mt-4 text-center">Você continua conectado neste celular.</p>
      </form>
    </div>
  );
}

function paginaDe(funcao: string) {
  return funcao === "garcom" ? "/garcom" : funcao === "cozinha" ? "/cozinha" : "/entregador";
}

/** Sair do app da equipe. */
export async function sairEquipe() {
  await fetch("/api/equipe-app/sair", { method: "POST" }).catch(() => {});
  window.location.href = "/equipe";
}
