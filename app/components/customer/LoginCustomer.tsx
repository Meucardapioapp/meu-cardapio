"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  corPrincipal?: string;
};

export default function LoginCustomer({ open, onClose, onSuccess, corPrincipal }: Props) {
  const cor = corPrincipal || "#18181b";
  const [telefone, setTelefone] = useState("");
  const [numeroPedido, setNumeroPedido] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  function formatarTelefone(valor: string) {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  }

  async function entrar() {
    if (telefone.replace(/\D/g, "").length < 10) {
      toast.error("Informe o telefone com DDD.");
      return;
    }
    if (!numeroPedido.trim()) {
      toast.error("Informe o número de um pedido que você já fez aqui.");
      return;
    }

    setLoading(true);
    const slug = window.location.pathname.split("/")[1];

    try {
      const response = await fetch("/api/cliente/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone, slug, numeroPedido }),
      });
      const resultado = await response.json();

      if (!resultado.success) {
        toast.error(resultado.error || "Não encontramos esse pedido. Confira os dados.");
        return;
      }

      localStorage.setItem(`cliente_token-${slug}`, resultado.token);
      onSuccess();
      onClose();
    } catch {
      toast.error("Erro de conexão. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[99998] bg-black/60" onClick={onClose} />

      <div className="fixed inset-0 z-[99999] flex items-end justify-center p-0 sm:items-center sm:p-5">
        <div
          className="relative w-full rounded-t-3xl bg-white p-6 sm:max-w-md sm:rounded-3xl"
          onKeyDown={(e) => e.key === "Enter" && !loading && entrar()}
        >
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 transition hover:bg-zinc-200"
          >
            <X size={20} className="text-zinc-600" />
          </button>

          <h2 className="text-2xl font-black">Entrar</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Já pediu aqui em outro celular? Digite o telefone e o número de um pedido que você já fez (aparece na
            confirmação, ex.: <strong>#12</strong>).
          </p>

          <input
            value={telefone}
            onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
            placeholder="(99) 99999-9999"
            inputMode="tel"
            autoFocus
            className="mt-6 h-14 w-full rounded-2xl border border-zinc-300 px-4 text-base outline-none focus:border-zinc-500"
          />

          <input
            value={numeroPedido}
            onChange={(e) => setNumeroPedido(e.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder="Número do pedido (ex.: 12)"
            inputMode="numeric"
            className="mt-3 h-14 w-full rounded-2xl border border-zinc-300 px-4 text-base outline-none focus:border-zinc-500"
          />

          <button
            onClick={entrar}
            disabled={loading}
            className="mt-5 h-14 w-full rounded-2xl font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
            style={{ backgroundColor: cor }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </div>
    </>
  );
}
