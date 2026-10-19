"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, KeyRound, Loader2, Lock, Trash2, Unlock, UserPlus, X } from "lucide-react";
import { apiFetch } from "@/utils/apiFetch";

type Membro = { id: string; nome: string; email: string; ativo: boolean; created_at: string };

export default function EquipePage() {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [indisponivel, setIndisponivel] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [acesso, setAcesso] = useState<{ nome: string; email: string; senha: string } | null>(null);

  async function carregar() {
    try {
      const d = await apiFetch("/api/painel/equipe").then((r) => r.json());
      setMembros(d?.membros ?? []);
      setIndisponivel(Boolean(d?.indisponivel));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      const d = await apiFetch("/api/painel/equipe", {
        method: "POST",
        body: JSON.stringify({ nome, email }),
      }).then((r) => r.json());
      if (!d?.success) {
        toast.error(d?.error || "Não foi possível adicionar.");
        return;
      }
      setMembros((l) => [...l, d.membro]);
      setAcesso({ nome: d.membro.nome, email: d.membro.email, senha: d.senha });
      setNome("");
      setEmail("");
    } finally {
      setSalvando(false);
    }
  }

  async function alterar(m: Membro, corpo: Record<string, unknown>) {
    const d = await apiFetch("/api/painel/equipe", {
      method: "PATCH",
      body: JSON.stringify({ id: m.id, ...corpo }),
    }).then((r) => r.json());
    if (!d?.success) {
      toast.error(d?.error || "Não foi possível salvar.");
      return null;
    }
    return d;
  }

  async function novaSenha(m: Membro) {
    const d = await alterar(m, { acao: "nova-senha" });
    if (d?.senha) setAcesso({ nome: m.nome, email: m.email, senha: d.senha });
  }

  async function alternar(m: Membro) {
    const d = await alterar(m, { ativo: !m.ativo });
    if (d) {
      setMembros((l) => l.map((x) => (x.id === m.id ? { ...x, ativo: !m.ativo } : x)));
      toast.success(m.ativo ? "Acesso bloqueado." : "Acesso liberado.");
    }
  }

  async function remover(m: Membro) {
    if (!confirm(`Remover ${m.nome} da equipe? O login dele(a) será apagado.`)) return;
    const d = await apiFetch("/api/painel/equipe", {
      method: "DELETE",
      body: JSON.stringify({ id: m.id }),
    }).then((r) => r.json());
    if (d?.success) {
      setMembros((l) => l.filter((x) => x.id !== m.id));
      toast.success("Removido da equipe.");
    } else toast.error(d?.error || "Não foi possível remover.");
  }

  const textoAcesso = acesso
    ? `Acesso ao painel de pedidos\nSite: ${typeof window !== "undefined" ? window.location.origin : ""}/login\nE-mail: ${acesso.email}\nSenha: ${acesso.senha}`
    : "";

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-black text-zinc-900 sm:text-3xl">Equipe</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Crie um acesso para quem atende os pedidos. O atendente só vê a tela de <strong>Pedidos</strong> e pode
        pausar a loja — não vê faturamento, plano, produtos nem dados bancários.
      </p>

      {indisponivel && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          A equipe será ativada na atualização do sistema.
        </div>
      )}

      <form onSubmit={adicionar} className="mt-6 grid gap-3 rounded-2xl border bg-white p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="text-sm font-semibold">
          Nome
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={60}
            placeholder="Ex.: Ana"
            className="mt-1 block h-11 w-full rounded-xl border px-3 text-base font-normal"
          />
        </label>
        <label className="text-sm font-semibold">
          E-mail de login
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ana@email.com"
            className="mt-1 block h-11 w-full rounded-xl border px-3 text-base font-normal"
          />
        </label>
        <button
          disabled={salvando || indisponivel || !nome.trim() || !email.trim()}
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#6D1F2F] px-5 font-bold text-white disabled:opacity-50"
        >
          {salvando ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />} Adicionar
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {carregando && <div className="h-20 animate-pulse rounded-2xl bg-white" />}
        {!carregando && membros.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center text-zinc-500">Ninguém na equipe ainda.</div>
        )}
        {membros.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center gap-3 rounded-2xl border bg-white p-4">
            <div className="min-w-0 flex-1">
              <p className="font-bold">
                {m.nome}{" "}
                {!m.ativo && <span className="ml-1 rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600">bloqueado</span>}
              </p>
              <p className="truncate text-sm text-zinc-500">{m.email}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => novaSenha(m)} title="Gerar nova senha" className="flex h-10 items-center gap-1 rounded-xl border px-3 text-sm">
                <KeyRound size={16} /> Nova senha
              </button>
              <button onClick={() => alternar(m)} title={m.ativo ? "Bloquear" : "Liberar"} className="flex h-10 w-10 items-center justify-center rounded-xl border">
                {m.ativo ? <Lock size={16} /> : <Unlock size={16} />}
              </button>
              <button onClick={() => remover(m)} title="Remover" className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {acesso && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6">
            <div className="flex items-start justify-between">
              <p className="text-lg font-black">Acesso de {acesso.nome}</p>
              <button onClick={() => setAcesso(null)} aria-label="Fechar"><X /></button>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Anote ou envie agora: por segurança, esta senha não aparece de novo.
            </p>
            <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-zinc-100 p-4 text-sm">{textoAcesso}</pre>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(textoAcesso).then(() => toast.success("Copiado!"))}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border font-semibold"
              >
                <Copy size={16} /> Copiar
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(textoAcesso)}`}
                target="_blank"
                rel="noreferrer"
                className="flex h-11 items-center justify-center rounded-xl bg-green-600 font-semibold text-white"
              >
                Enviar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
