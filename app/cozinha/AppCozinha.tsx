"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Bell, Check, Loader2, LogOut, Printer, RotateCcw } from "lucide-react";
import EntrarEquipe, { sairEquipe } from "@/app/components/equipe/EntrarEquipe";
import { minutosDesde, hora } from "@/app/components/salao/comum";
import { liberarSom, somLiberado, tocarAlerta } from "@/lib/alerta-sonoro";

type Item = {
  id: string;
  nome: string;
  detalhes: string[];
  observacao: string | null;
  quantidade: number;
  setor: string;
  status: "novo" | "pronto" | "cancelado";
  alterado_em: string | null;
};
type Grupo = { lancamento: string; comanda_id: string; mesa: string; comanda: number; por: string; origem: string; criado_em: string; itens: Item[] };
type Dados = { setor: string; setores: string[]; eu: { nome: string; restaurante: string } | null; pendentes: Grupo[]; prontos: Grupo[] };

/**
 * Tela do preparo (cozinha, churrasqueira, bar): cada pedido do garçom vira
 * um cartão com a mesa. Toque em "Pronto" e o garçom é avisado.
 */
export default function AppCozinha() {
  const [estado, setEstado] = useState<"carregando" | "entrar" | "app">("carregando");
  const [dados, setDados] = useState<Dados | null>(null);
  const [som, setSom] = useState(true);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [, relogio] = useState(0);
  const vistos = useRef<Set<string> | null>(null);

  const carregar = useCallback(async () => {
    try {
      const r = await fetch("/api/salao/cozinha", { cache: "no-store" });
      if (r.status === 401) {
        setEstado("entrar");
        return;
      }
      const d = await r.json();
      if (!d?.success) return;
      const ids = new Set<string>((d.pendentes as Grupo[]).map((g) => g.lancamento));
      if (vistos.current && [...ids].some((id) => !vistos.current!.has(id))) {
        tocarAlerta("pedido");
        toast.success("Pedido novo!");
      }
      vistos.current = ids;
      setDados(d);
      setEstado("app");
    } catch {}
  }, []);

  useEffect(() => {
    carregar();
    setSom(somLiberado());
    const t = setInterval(() => !document.hidden && carregar(), 5000);
    const r = setInterval(() => relogio((n) => n + 1), 30000);
    return () => {
      clearInterval(t);
      clearInterval(r);
    };
  }, [carregar]);

  async function marcar(itemIds: string[], acao: "pronto" | "desfazer", chave: string) {
    setEnviando(chave);
    try {
      const r = await fetch("/api/salao/cozinha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao, itemIds }),
      });
      const d = await r.json().catch(() => null);
      if (!d?.success) toast.error(d?.error || "Não foi possível salvar.");
      await carregar();
    } finally {
      setEnviando(null);
    }
  }

  if (estado === "carregando") {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-900">
        <Loader2 className="animate-spin text-zinc-500" size={32} />
      </div>
    );
  }
  if (estado === "entrar") return <EntrarEquipe titulo="Cozinha" emoji="🔥" paginaAtual="/cozinha" onEntrou={carregar} />;

  const pendentes = dados?.pendentes ?? [];

  return (
    <div className="min-h-dvh bg-zinc-900 pb-10 text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-900/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-3 px-4">
          <div className="min-w-0">
            <p className="truncate text-xl font-black">🔥 {dados?.setor === "Todos" ? "Preparo" : dados?.setor}</p>
            <p className="truncate text-xs text-white/50">
              {dados?.eu?.nome} · {dados?.eu?.restaurante}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-amber-400 px-3 py-1 text-sm font-black text-zinc-900">{pendentes.length} na fila</span>
            <button onClick={sairEquipe} aria-label="Sair" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="space-y-4 p-4">
        {!som && (
          <button
            onClick={() => {
              liberarSom();
              tocarAlerta("pedido");
              setSom(true);
            }}
            className="flex w-full items-center gap-3 rounded-2xl bg-amber-400 p-4 text-left text-zinc-900"
          >
            <Bell className="shrink-0" />
            <span className="font-bold">Toque aqui para ligar o som dos pedidos novos.</span>
          </button>
        )}

        {pendentes.length === 0 && (
          <div className="rounded-2xl bg-white/5 p-12 text-center">
            <p className="text-5xl">👌</p>
            <p className="mt-3 text-lg font-bold">Tudo em dia</p>
            <p className="text-sm text-white/60">Deixe esta tela aberta: pedido novo aparece aqui com aviso sonoro.</p>
          </div>
        )}

        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))]">
          {pendentes.map((g) => {
            const minutos = minutosDesde(g.criado_em);
            const novos = g.itens.filter((i) => i.status === "novo");
            const atrasado = minutos >= 20;
            return (
              <article key={g.lancamento} className={`overflow-hidden rounded-2xl bg-white text-zinc-900 ${atrasado ? "ring-4 ring-red-500" : ""}`}>
                <div className={`flex items-center justify-between px-4 py-3 ${atrasado ? "bg-red-600 text-white" : "bg-amber-400"}`}>
                  <p className="text-3xl font-black leading-none">Mesa {g.mesa}</p>
                  <div className="text-right text-sm font-bold leading-tight">
                    <p>{minutos} min</p>
                    <p className="font-semibold opacity-80">{hora(g.criado_em)}</p>
                  </div>
                </div>
                <p className="px-4 pt-2 text-xs font-semibold text-zinc-500">
                  {g.origem === "qr" ? "Pedido pelo QR da mesa" : `Garçom: ${g.por}`}
                  {dados?.setor === "Todos" ? "" : ""}
                </p>
                <ul className="divide-y px-4">
                  {g.itens.map((i) => (
                    <li key={i.id} className={`py-2.5 ${i.status !== "novo" ? "opacity-60" : ""}`}>
                      <div className="flex items-start gap-3">
                        <span className={`text-2xl font-black leading-none ${i.status === "cancelado" ? "line-through text-red-600" : ""}`}>{i.quantidade}x</span>
                        <div className="min-w-0 flex-1">
                          <p className={`text-lg font-bold leading-tight ${i.status === "cancelado" ? "line-through text-red-600" : ""}`}>{i.nome}</p>
                          {i.detalhes?.map((d) => (
                            <p key={d} className="text-sm text-zinc-600">{d}</p>
                          ))}
                          {i.observacao && <p className="mt-1 rounded-lg bg-amber-100 px-2 py-1 text-sm font-bold text-amber-900">⚠ {i.observacao}</p>}
                          <div className="mt-1 flex flex-wrap gap-1">
                            {i.status === "cancelado" && <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-black text-white">CANCELADO</span>}
                            {i.alterado_em && i.status === "novo" && <span className="rounded bg-blue-600 px-2 py-0.5 text-xs font-black text-white">ALTERADO</span>}
                            {dados?.setor === "Todos" && <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600">{i.setor}</span>}
                            {i.status === "pronto" && <span className="rounded bg-green-600 px-2 py-0.5 text-xs font-black text-white">PRONTO</span>}
                          </div>
                        </div>
                        {i.status === "novo" && novos.length > 1 && (
                          <button
                            disabled={enviando !== null}
                            onClick={() => marcar([i.id], "pronto", i.id)}
                            aria-label={`${i.nome} pronto`}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-green-600 text-green-700"
                          >
                            {enviando === i.id ? <Loader2 size={18} className="animate-spin" /> : <Check size={20} />}
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 p-3">
                  <button
                    onClick={() => window.open(`/imprimir/salao/${g.comanda_id}?l=${g.lancamento}${dados?.setor && dados.setor !== "Todos" ? `&s=${encodeURIComponent(dados.setor)}` : ""}`, "_blank")}
                    aria-label="Imprimir"
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-100"
                  >
                    <Printer size={20} />
                  </button>
                  <button
                    disabled={enviando !== null || !novos.length}
                    onClick={() => marcar(novos.map((i) => i.id), "pronto", g.lancamento)}
                    className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 text-lg font-black text-white disabled:opacity-60"
                  >
                    {enviando === g.lancamento ? <Loader2 className="animate-spin" /> : <Check />} Pronto
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {(dados?.prontos.length ?? 0) > 0 && (
          <section className="pt-4">
            <p className="mb-2 text-sm font-bold uppercase tracking-wider text-white/50">Prontos (últimos 30 min)</p>
            <div className="space-y-2">
              {dados!.prontos.map((g) => (
                <div key={g.lancamento} className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                  <p className="w-20 shrink-0 font-black">Mesa {g.mesa}</p>
                  <p className="min-w-0 flex-1 truncate text-sm text-white/70">
                    {g.itens.filter((i) => i.status === "pronto").map((i) => `${i.quantidade}x ${i.nome}`).join(", ")}
                  </p>
                  <button
                    disabled={enviando !== null}
                    onClick={() => marcar(g.itens.filter((i) => i.status === "pronto").map((i) => i.id), "desfazer", g.lancamento)}
                    className="flex h-10 shrink-0 items-center gap-1 rounded-lg bg-white/10 px-3 text-sm font-semibold"
                  >
                    <RotateCcw size={14} /> Desfazer
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
