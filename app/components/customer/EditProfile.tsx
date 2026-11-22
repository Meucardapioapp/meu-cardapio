"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  cliente: any;
  onSaved: () => void;
  corPrincipal?: string;
};

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

export default function EditProfile({ open, onClose, cliente, onSaved, corPrincipal }: Props) {
  const cor = corPrincipal || "#18181b";
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cliente) return;
    setNome(cliente.nome || "");
    setTelefone(cliente.telefone || "");
    setCpf(cliente.cpf || "");
  }, [cliente]);

  if (!open) return null;

  async function salvar() {
    if (!nome.trim()) {
      toast.error("Informe seu nome.");
      return;
    }
    if (telefone.replace(/\D/g, "").length < 10) {
      toast.error("Informe um telefone válido com DDD.");
      return;
    }

    setLoading(true);
    // O token fica salvo por restaurante: cliente_token-{slug}.
    const slug = window.location.pathname.split("/")[1];
    const token = localStorage.getItem(`cliente_token-${slug}`);

    try {
      const response = await fetch("/api/cliente/editar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nome: nome.trim(), telefone, cpf }),
      });
      const resultado = await response.json();

      if (!resultado.success) {
        toast.error(resultado.error || "Não foi possível salvar.");
        return;
      }

      toast.success("Dados salvos!");
      onSaved();
      onClose();
    } catch {
      toast.error("Erro de conexão. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[10000] bg-black/60" onClick={onClose} />
      <div className="fixed inset-0 z-[10001] flex items-end justify-center p-0 sm:items-center sm:p-5">
        <div
          className="relative w-full rounded-t-3xl bg-white p-6 sm:max-w-md sm:rounded-3xl"
          onKeyDown={(e) => e.key === "Enter" && !loading && salvar()}
        >
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 transition hover:bg-zinc-200"
          >
            <X size={20} />
          </button>

          <h2 className="text-2xl font-black">Editar meus dados</h2>

          <div className="mt-6 space-y-5">
            <div>
              <label className="text-sm font-semibold">Nome</label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-zinc-300 px-4 outline-none focus:border-zinc-500"
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Telefone</label>
              <input
                value={telefone}
                onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                inputMode="tel"
                className="mt-2 h-12 w-full rounded-xl border border-zinc-300 px-4 outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">
                CPF <span className="font-normal text-zinc-400">(opcional)</span>
              </label>
              <input
                value={cpf}
                onChange={(e) => setCpf(formatarCPF(e.target.value))}
                inputMode="numeric"
                placeholder="Só se o restaurante pedir na nota"
                className="mt-2 h-12 w-full rounded-xl border border-zinc-300 px-4 outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button onClick={onClose} className="h-12 flex-1 rounded-xl border border-zinc-300 font-semibold hover:bg-zinc-100">
              Cancelar
            </button>
            <button
              onClick={salvar}
              disabled={loading}
              className="h-12 flex-1 rounded-xl font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
              style={{ backgroundColor: cor }}
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
