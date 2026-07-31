"use client";

import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function LoginCustomer({
  open,
  onClose,
  onSuccess,
}: Props) {
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  function formatarTelefone(valor: string) {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);

    if (numeros.length <= 2) {
      return numeros;
    }

    if (numeros.length <= 7) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    }

    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  }

  async function entrar() {
    setLoading(true);

    const slug = window.location.pathname.split("/")[1];

    const response = await fetch("/api/cliente/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        telefone,
        slug,
      }),
    });

    const resultado = await response.json();

    setLoading(false);

    if (!resultado.success) {
      alert(resultado.error);
      return;
    }

    localStorage.setItem(
      `cliente_token-${slug}`,
      resultado.token
    );

    onSuccess();
    onClose();
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-[99998]"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-5">
        <div className="bg-white rounded-3xl w-full max-w-md p-6">

          <h2 className="text-3xl font-black">
            Entrar
          </h2>

          <p className="text-zinc-500 mt-2">
            Digite o telefone utilizado no seu primeiro pedido.
          </p>

          <input
            value={telefone}
            onChange={(e) =>
              setTelefone(formatarTelefone(e.target.value))
            }
            placeholder="(99) 99999-9999"
            className="w-full h-14 rounded-2xl border px-4 mt-6"
          />

          <button
            onClick={entrar}
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-black text-white font-semibold mt-5"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

        </div>
      </div>
    </>
  );
}