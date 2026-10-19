"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, KeyRound, Loader2, Lock, Trash2, Unlock, UserPlus, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { apiFetch } from "@/utils/apiFetch";

type Funcao = "garcom" | "cozinha" | "motoboy";
type Pessoa = {
  id: string;
  nome: string;
  telefone: string;
  funcao: Funcao;
  setor: string | null;
  ativo: boolean;
  ultimo_acesso: string | null;
  resumo: Record<string, number>;
};

const COR = "#6D1F2F";
const FUNCOES: { id: Funcao; nome: string; plural: string; emoji: string; dica: string }[] = [
  { id: "garcom", nome: "Garçom", plural: "Garçons", emoji: "🧑‍🍳", dica: "anota os pedidos das mesas pelo celular" },
  { id: "cozinha", nome: "Cozinha", plural: "Cozinha", emoji: "🔥", dica: "recebe os pedidos para preparar (cozinha, churrasqueira, bar)" },
  { id: "motoboy", nome: "Motoboy", plural: "Motoboys", emoji: "🛵", dica: "recebe o endereço das entregas do delivery" },
];
const reais = (v: number) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function formatarCelular(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function inicioDoPeriodo(p: "hoje" | "7dias") {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (p === "7dias") d.setDate(d.getDate() - 6);
  return d.toISOString();
}

/** Equipe do restaurante com acesso pelo celular: garçons, cozinha e motoboys. */
export default function EquipeSalaoPage() {
  const [lista, setLista] = useState<Pessoa[]>([]);
  const [setores, setSetores] = useState<string[]>(["Cozinha", "Churrasqueira", "Bar"]);
  const [carregando, setCarregando] = useState(true);
  const [indisponivel, setIndisponivel] = useState(false);
  const [periodo, setPeriodo] = useState<"hoje" | "7dias">("hoje");
  const [filtro, setFiltro] = useState<Funcao | "todos">("todos");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [funcao, setFuncao] = useState<Funcao>("garcom");
  const [setor, setSetor] = useState("Todos");
  const [salvando, setSalvando] = useState(false);
  const [acesso, setAcesso] = useState<{ nome: string; telefone: string; pin: string; funcao: Funcao } | null>(null);

  async function carregar(p = periodo) {
    try {
      const d = await apiFetch(`/api/painel/funcionarios?desde=${encodeURIComponent(inicioDoPeriodo(p))}`).then((r) => r.json());
      setLista(d?.funcionarios ?? []);
      if (d?.setores?.length) setSetores(d.setores);
      setIndisponivel(Boolean(d?.indisponivel));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    // Veio do link antigo "Motoboys"
    try {
      const f = new URLSearchParams(window.location.search).get("funcao") as Funcao | null;
      if (f && FUNCOES.some((x) => x.id === f)) {
        setFiltro(f);
        setFuncao(f);
      }
    } catch {}
  }, []);

  useEffect(() => {
    carregar(periodo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo]);

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      const d = await apiFetch("/api/painel/funcionarios", {
        method: "POST",
        body: JSON.stringify({ nome, telefone, funcao, setor: funcao === "cozinha" ? setor : undefined }),
      }).then((r) => r.json());
      if (!d?.success) {
        toast.error(d?.error || "Não foi possível cadastrar.");
        return;
      }
      setAcesso({ nome: d.funcionario.nome, telefone: d.funcionario.telefone, pin: d.pin, funcao });
      setNome("");
      setTelefone("");
      carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function alterar(p: Pessoa, corpo: Record<string, unknown>) {
    const d = await apiFetch("/api/painel/funcionarios", { method: "PATCH", body: JSON.stringify({ id: p.id, ...corpo }) }).then((r) => r.json());
    if (!d?.success) {
      toast.error(d?.error || "Não foi possível salvar.");
      return null;
    }
    return d;
  }

  async function novoPin(p: Pessoa) {
    if (!confirm(`Gerar um PIN novo para ${p.nome}? O PIN antigo para de funcionar.`)) return;
    const d = await alterar(p, { acao: "novo-pin" });
    if (d?.pin) setAcesso({ nome: p.nome, telefone: p.telefone, pin: d.pin, funcao: p.funcao });
  }

  async function remover(p: Pessoa) {
    if (!confirm(`Remover ${p.nome} da equipe? O histórico fica guardado.`)) return;
    const d = await apiFetch("/api/painel/funcionarios", { method: "DELETE", body: JSON.stringify({ id: p.id }) }).then((r) => r.json());
    if (d?.success) {
      setLista((l) => l.filter((x) => x.id !== p.id));
      toast.success("Removido da equipe.");
    } else toast.error(d?.error || "Não foi possível remover.");
  }

  const origem = typeof window !== "undefined" ? window.location.origin : "";
  const textoAcesso = acesso
    ? `Olá, ${acesso.nome.split(" ")[0]}! Seu acesso ao ${acesso.funcao === "garcom" ? "app do garçom" : acesso.funcao === "cozinha" ? "app da cozinha" : "app de entregas"}:\n\n📲 Abra: ${origem}/equipe\nCelular: ${formatarCelular(acesso.telefone)}\nPIN: ${acesso.pin}\n\nDica: adicione a página à tela inicial do celular.`
    : "";

  const visiveis = lista.filter((p) => filtro === "todos" || p.funcao === filtro);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-black text-zinc-900 sm:text-3xl">Equipe</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Cada pessoa entra pelo celular em <strong>{origem.replace(/^https?:\/\//, "")}/equipe</strong> com o número dela e um PIN.
        O garçom anota os pedidos das mesas, a cozinha recebe para preparar e o motoboy recebe as entregas.
      </p>

      {indisponivel && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          A equipe será ativada na atualização do sistema (SQL 15).
        </div>
      )}

      <form onSubmit={adicionar} className="mt-6 rounded-2xl border bg-white p-5">
        <p className="font-bold">Cadastrar</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {FUNCOES.map((f) => (
            <button
              type="button"
              key={f.id}
              onClick={() => setFuncao(f.id)}
              className={`rounded-xl border-2 p-2 text-center ${funcao === f.id ? "border-[#6D1F2F] bg-[#6D1F2F]/5" : "border-zinc-200"}`}
            >
              <span className="block text-2xl">{f.emoji}</span>
              <span className="block text-sm font-bold">{f.nome}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-zinc-500">{FUNCOES.find((f) => f.id === funcao)?.dica}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
          <label className="text-sm font-semibold">
            Nome
            <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={40} placeholder="Ex.: João" className="mt-1 block h-11 w-full rounded-xl border px-3 text-base font-normal" />
          </label>
          <label className="text-sm font-semibold">
            Celular (é o login)
            <input
              value={telefone}
              onChange={(e) => setTelefone(formatarCelular(e.target.value))}
              inputMode="tel"
              placeholder="(65) 99999-9999"
              className="mt-1 block h-11 w-full rounded-xl border px-3 text-base font-normal"
            />
          </label>
          {funcao === "cozinha" && (
            <label className="text-sm font-semibold sm:col-span-3 sm:order-last">
              Setor (o que essa pessoa vê na tela)
              <select value={setor} onChange={(e) => setSetor(e.target.value)} className="mt-1 block h-11 w-full rounded-xl border bg-white px-3 text-base font-normal sm:w-72">
                <option value="Todos">Todos os setores</option>
                {setores.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          )}
          <button
            disabled={salvando || indisponivel || nome.trim().length < 2 || telefone.replace(/\D/g, "").length < 10}
            className="flex h-11 items-center justify-center gap-2 rounded-xl px-5 font-bold text-white disabled:opacity-50"
            style={{ backgroundColor: COR }}
          >
            {salvando ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />} Cadastrar
          </button>
        </div>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {([{ id: "todos", plural: "Todos" }, ...FUNCOES] as { id: Funcao | "todos"; plural: string }[]).map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className={`h-9 rounded-full px-4 text-sm font-semibold ${filtro === f.id ? "text-white" : "border bg-white text-zinc-700"}`}
              style={filtro === f.id ? { backgroundColor: COR } : undefined}
            >
              {f.plural} ({f.id === "todos" ? lista.length : lista.filter((p) => p.funcao === f.id).length})
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-xl border bg-white p-1 text-sm font-semibold">
          {(["hoje", "7dias"] as const).map((p) => (
            <button key={p} onClick={() => setPeriodo(p)} className={`h-8 rounded-lg px-3 ${periodo === p ? "bg-[#6D1F2F] text-white" : "text-zinc-600"}`}>
              {p === "hoje" ? "Hoje" : "7 dias"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-3 grid-cols-[repeat(auto-fill,minmax(min(100%,19rem),1fr))]">
        {carregando && <div className="h-32 animate-pulse rounded-2xl bg-white" />}
        {!carregando && !visiveis.length && <div className="col-span-full rounded-2xl bg-white p-8 text-center text-zinc-500">Ninguém cadastrado aqui ainda.</div>}
        {visiveis.map((p) => {
          const f = FUNCOES.find((x) => x.id === p.funcao)!;
          const r = p.resumo || {};
          const numeros: [string, string][] =
            p.funcao === "garcom"
              ? [["mesas", String(r.mesas ?? 0)], ["com 10%", String(r.comDez ?? 0)], ["de 10%", reais(r.dez ?? 0)]]
              : p.funcao === "cozinha"
                ? [["itens preparados", String(r.itens ?? 0)]]
                : [["entregas", String(r.entregas ?? 0)], ["em taxas", reais(r.taxas ?? 0)]];
          return (
            <div key={p.id} className={`flex flex-col gap-3 rounded-2xl border bg-white p-4 ${p.ativo ? "" : "opacity-60"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold">
                    {f.emoji} {p.nome}
                    {!p.ativo && <span className="ml-2 rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600">bloqueado</span>}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {f.nome}
                    {p.funcao === "cozinha" ? ` · ${p.setor === "Todos" || !p.setor ? "todos os setores" : p.setor}` : ""} · {formatarCelular(p.telefone)}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {p.ultimo_acesso ? `Entrou em ${new Date(p.ultimo_acesso).toLocaleDateString("pt-BR")}` : "Ainda não entrou no app"}
                  </p>
                </div>
                {(r.emRota ?? 0) > 0 && <span className="shrink-0 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-800">{r.emRota} em rota</span>}
                {(r.abertas ?? 0) > 0 && <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">{r.abertas} {r.abertas === 1 ? "mesa aberta" : "mesas abertas"}</span>}
              </div>

              <div className={`grid gap-2 text-center ${numeros.length === 3 ? "grid-cols-3" : numeros.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
                {numeros.map(([t, v]) => (
                  <div key={t} className="rounded-xl bg-zinc-50 py-2">
                    <p className="text-lg font-black">{v}</p>
                    <p className="text-xs text-zinc-500">{t}</p>
                  </div>
                ))}
              </div>

              {p.funcao === "cozinha" && (
                <select
                  value={p.setor || "Todos"}
                  onChange={async (e) => {
                    const novo = e.target.value;
                    if (await alterar(p, { setor: novo })) setLista((l) => l.map((x) => (x.id === p.id ? { ...x, setor: novo } : x)));
                  }}
                  className="h-10 rounded-xl border bg-white px-2 text-sm"
                >
                  <option value="Todos">Vê todos os setores</option>
                  {setores.map((s) => (
                    <option key={s} value={s}>Vê só: {s}</option>
                  ))}
                </select>
              )}

              <div className="flex flex-wrap gap-2 border-t pt-3">
                <button onClick={() => novoPin(p)} className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-semibold">
                  <KeyRound size={16} /> Enviar acesso
                </button>
                <button
                  onClick={async () => {
                    if (await alterar(p, { ativo: !p.ativo })) {
                      setLista((l) => l.map((x) => (x.id === p.id ? { ...x, ativo: !p.ativo } : x)));
                      toast.success(p.ativo ? "Acesso bloqueado." : "Acesso liberado.");
                    }
                  }}
                  title={p.ativo ? "Bloquear" : "Liberar"}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border"
                >
                  {p.ativo ? <Lock size={16} /> : <Unlock size={16} />}
                </button>
                <button onClick={() => remover(p)} title="Remover" className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-sm text-zinc-500">
        Quem atende no caixa pelo computador usa o login do painel:{" "}
        <Link href="/admin/equipe" className="font-semibold text-[#6D1F2F] underline">acessos ao painel</Link>.
      </p>

      {acesso && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6">
            <div className="flex items-start justify-between">
              <p className="text-lg font-black">Acesso de {acesso.nome}</p>
              <button onClick={() => setAcesso(null)} aria-label="Fechar"><X /></button>
            </div>
            <p className="mt-1 text-sm text-zinc-500">Envie agora. Por segurança, o PIN não aparece de novo (dá para gerar outro depois).</p>
            <div className="mt-4 rounded-2xl bg-zinc-100 p-4 text-center">
              <p className="text-xs text-zinc-500">PIN</p>
              <p className="text-4xl font-black tracking-[0.3em]">{acesso.pin}</p>
            </div>
            <pre className="mt-3 whitespace-pre-wrap rounded-2xl border bg-zinc-50 p-4 text-sm">{textoAcesso}</pre>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(textoAcesso).then(() => toast.success("Copiado!"))}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border font-semibold"
              >
                <Copy size={16} /> Copiar
              </button>
              <a
                href={`https://wa.me/55${acesso.telefone}?text=${encodeURIComponent(textoAcesso)}`}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-green-600 font-semibold text-white"
              >
                <FaWhatsapp size={18} /> Enviar para ele
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
