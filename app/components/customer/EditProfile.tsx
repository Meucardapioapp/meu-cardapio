"use client";

import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  cliente: any;
  onSaved: () => void;
};

export default function EditProfile({
  open,
  onClose,
  cliente,
  onSaved,
}: Props) {

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");

  const [loading, setLoading] = useState(false);

  function formatarCPF(valor: string) {
  return valor
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    .slice(0, 14);
}

function formatarTelefone(valor: string) {
  return valor
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .slice(0, 15);
}

  useEffect(() => {

    if (!cliente) return;

    setNome(cliente.nome || "");
    setTelefone(cliente.telefone || "");
    setCpf(cliente.cpf || "");

  }, [cliente]);

  if (!open) return null;

  async function salvar() {

    setLoading(true);

    const token = localStorage.getItem("cliente_token");

    const response = await fetch("/api/cliente/editar", {

      method: "PUT",

      headers: {

        "Content-Type": "application/json",

      },

      body: JSON.stringify({

        token,
        nome,
        telefone,
        cpf,

      }),

    });

    const resultado = await response.json();

    setLoading(false);

    if (!resultado.success) {

      alert(resultado.error || "Erro ao salvar.");

      return;

    }

    onSaved();

    onClose();

  }

  return (

    <div className="fixed inset-0 z-[10000] bg-black/60 flex items-center justify-center p-5">

      <div className="bg-white rounded-3xl w-full max-w-md p-6">

        <h2 className="text-2xl font-black">

          Editar meus dados

        </h2>

        <div className="space-y-5 mt-6">

          <div>

            <label className="text-sm font-semibold">

              Nome

            </label>

            <input
              value={nome}
              onChange={(e)=>setNome(e.target.value)}
              className="w-full mt-2 h-12 rounded-xl border px-4"
            />

          </div>

          <div>

            <label className="text-sm font-semibold">

              Telefone

            </label>

            <input
              value={telefone}
              onChange={(e)=>setTelefone(formatarTelefone(e.target.value))}
              className="w-full mt-2 h-12 rounded-xl border px-4"
            />

          </div>

          <div>

<label className="text-sm font-semibold">
  CPF
</label>

<input
  value={cpf}
  onChange={(e) => setCpf(formatarCPF(e.target.value))}
  inputMode="numeric"
  className="w-full mt-2 h-12 rounded-xl border px-4"
/>

          </div>

        </div>

        <div className="flex gap-3 mt-8">

          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-xl border"
          >

            Cancelar

          </button>

          <button
            onClick={salvar}
            disabled={loading}
            className="flex-1 h-12 rounded-xl bg-[#6D1F2F] text-white font-semibold"
          >

            {loading ? "Salvando..." : "Salvar"}

          </button>

        </div>

      </div>

    </div>

  );

}