"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Loader2, PauseCircle, Search } from "lucide-react";
import { apiFetch } from "@/utils/apiFetch";

type Complemento = { nome: string; pausado: boolean; parcial: boolean; produtos: string[]; preco: number };

/**
 * Pausar complementos que acabaram (ex.: leite condensado).
 * Pausa em todos os produtos de uma vez; ao ativar, volta em todos.
 */
export default function ComplementosPage() {
  const [lista, setLista] = useState<Complemento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [colunaExiste, setColunaExiste] = useState(true);
  const [busca, setBusca] = useState("");
  const [salvando, setSalvando] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/painel/complementos")
      .then((r) => r.json())
      .then((d) => {
        if (!d?.success) throw new Error(d?.error);
        setLista(d.complementos ?? []);
        setColunaExiste(d.colunaExiste !== false);
      })
      .catch(() => toast.error("Não foi possível carregar os complementos."))
      .finally(() => setCarregando(false));
  }, []);

  const filtrados = useMemo(() => {
    const b = busca.trim().toLowerCase();
    return b ? lista.filter((c) => c.nome.toLowerCase().includes(b)) : lista;
  }, [lista, busca]);

  const pausados = lista.filter((c) => c.pausado).length;

  async function alternar(c: Complemento) {
    const pausar = !c.pausado;
    setSalvando(c.nome);
    try {
      const r = await apiFetch("/api/painel/complementos", {
        method: "POST",
        body: JSON.stringify({ nome: c.nome, pausado: pausar }),
      });
      const d = await r.json().catch(() => null);
      if (!r.ok || !d?.success) throw new Error(d?.error || "Não foi possível alterar.");
      setLista((l) => l.map((x) => (x.nome === c.nome ? { ...x, pausado: pausar, parcial: false } : x)));
      toast.success(pausar ? `${c.nome} pausado: saiu do cardápio.` : `${c.nome} voltou para o cardápio.`);
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível alterar.");
    } finally {
      setSalvando(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/admin/produtos" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600">
        <ArrowLeft size={16} /> Voltar para produtos
      </Link>

      <h1 className="mt-3 text-2xl sm:text-3xl font-black text-zinc-900">Meus complementos</h1>
      <p className="text-sm text-zinc-500 mt-1">
        Todos os complementos e adicionais dos seus produtos, num lugar só. Acabou algum? Pause aqui e ele sai do
        cardápio em todos os produtos que usam. Quando chegar, é só ativar de novo.
      </p>

      {!colunaExiste && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Para pausar complementos, falta atualizar o banco de dados (SQL 23). Fale com o suporte.
        </div>
      )}

      {pausados > 0 && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
          <PauseCircle size={16} /> {pausados} {pausados === 1 ? "complemento pausado" : "complementos pausados"}
        </p>
      )}

      <div className="relative mt-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar complemento (ex.: leite condensado)"
          className="w-full h-11 rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-base"
        />
      </div>

      {carregando && (
        <div className="mt-6 flex justify-center">
          <Loader2 className="animate-spin text-[#6D1F2F]" />
        </div>
      )}

      {!carregando && lista.length === 0 && (
        <div className="mt-6 rounded-2xl bg-white border p-8 text-center text-zinc-600">
          Nenhum complemento cadastrado ainda. Eles aparecem aqui quando você coloca escolhas ou adicionais nos produtos.
        </div>
      )}

      <div className="mt-4 space-y-2">
        {filtrados.map((c) => {
          const ativo = !c.pausado;
          return (
            <div
              key={c.nome}
              className={`flex items-center gap-3 rounded-2xl border bg-white p-3 ${ativo ? "" : "border-amber-200 bg-amber-50/60"}`}
            >
              <div className="min-w-0 flex-1">
                <p className={`font-bold ${ativo ? "text-zinc-900" : "text-zinc-500 line-through"}`}>
                  {c.nome}
                  {c.preco > 0 && <span className="ml-2 text-xs font-medium text-zinc-500 no-underline">+ {c.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  {c.produtos.length === 1 ? "Em 1 produto" : `Em ${c.produtos.length} produtos`}: {c.produtos.join(", ")}
                </p>
                {c.parcial && <p className="text-xs font-semibold text-amber-700">Pausado só em alguns produtos: ative e pause de novo para acertar todos</p>}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={ativo}
                aria-label={ativo ? `Pausar ${c.nome}` : `Ativar ${c.nome}`}
                disabled={salvando === c.nome || !colunaExiste}
                onClick={() => alternar(c)}
                className="flex shrink-0 items-center gap-2 disabled:opacity-50"
              >
                <span className={`text-xs font-semibold ${ativo ? "text-green-700" : "text-amber-700"}`}>
                  {salvando === c.nome ? "Salvando…" : ativo ? "Disponível" : "Pausado"}
                </span>
                <span className={`relative w-10 h-6 rounded-full transition ${ativo ? "bg-green-500" : "bg-zinc-300"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${ativo ? "left-[18px]" : "left-0.5"}`} />
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
