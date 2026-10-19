"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Star } from "lucide-react";
import { apiFetch } from "@/utils/apiFetch";

type Avaliacao = {
  id: string;
  pedido_id: string;
  nota: number;
  comentario: string | null;
  nome: string | null;
  visivel: boolean;
  created_at: string;
};

function Estrelas({ nota }: { nota: number }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={16} className={n <= nota ? "fill-amber-400 text-amber-400" : "text-zinc-300"} />
      ))}
    </span>
  );
}

export default function AvaliacoesPage() {
  const [lista, setLista] = useState<Avaliacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [indisponivel, setIndisponivel] = useState(false);
  const [filtro, setFiltro] = useState<"todas" | "boas" | "ruins">("todas");

  useEffect(() => {
    apiFetch("/api/painel/avaliacoes")
      .then((r) => r.json())
      .then((d) => {
        setLista(d?.avaliacoes ?? []);
        setIndisponivel(Boolean(d?.indisponivel));
      })
      .catch(() => toast.error("Não foi possível carregar as avaliações."))
      .finally(() => setCarregando(false));
  }, []);

  const resumo = useMemo(() => {
    const total = lista.length;
    const media = total ? lista.reduce((s, a) => s + a.nota, 0) / total : 0;
    const porNota = [5, 4, 3, 2, 1].map((n) => ({ n, qtd: lista.filter((a) => a.nota === n).length }));
    return { total, media, porNota };
  }, [lista]);

  const filtradas = lista.filter((a) =>
    filtro === "boas" ? a.nota >= 4 : filtro === "ruins" ? a.nota <= 3 : true
  );

  async function alternar(a: Avaliacao) {
    const visivel = !a.visivel;
    setLista((l) => l.map((x) => (x.id === a.id ? { ...x, visivel } : x)));
    const r = await apiFetch("/api/painel/avaliacoes", {
      method: "PATCH",
      body: JSON.stringify({ id: a.id, visivel }),
    }).catch(() => null);
    if (!r?.ok) {
      setLista((l) => l.map((x) => (x.id === a.id ? { ...x, visivel: a.visivel } : x)));
      toast.error("Não foi possível salvar.");
    } else {
      toast.success(visivel ? "Comentário aparece no cardápio." : "Comentário escondido do cardápio.");
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-black text-zinc-900 sm:text-3xl">Avaliações</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Depois que o pedido sai, o cliente pode dar de 1 a 5 estrelas. A nota aparece no seu cardápio
        a partir de 3 avaliações.
      </p>

      {indisponivel && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          As avaliações serão ativadas na atualização do sistema.
        </div>
      )}

      {carregando ? (
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-white" />
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-[220px_1fr]">
            <div className="rounded-2xl border bg-white p-5 text-center">
              <p className="text-5xl font-black">
                {resumo.total ? resumo.media.toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 }) : "–"}
              </p>
              <div className="mt-2 flex justify-center"><Estrelas nota={Math.round(resumo.media)} /></div>
              <p className="mt-1 text-sm text-zinc-500">{resumo.total} avaliações</p>
            </div>
            <div className="space-y-2 rounded-2xl border bg-white p-5">
              {resumo.porNota.map(({ n, qtd }) => (
                <div key={n} className="flex items-center gap-3 text-sm">
                  <span className="w-10 text-zinc-600">{n} ★</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${resumo.total ? (qtd / resumo.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-zinc-500">{qtd}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            {([
              ["todas", "Todas"],
              ["boas", "4 e 5 estrelas"],
              ["ruins", "Até 3 estrelas"],
            ] as const).map(([id, nome]) => (
              <button
                key={id}
                onClick={() => setFiltro(id)}
                className={`h-9 rounded-full px-4 text-sm font-semibold ${
                  filtro === id ? "bg-[#6D1F2F] text-white" : "border bg-white text-zinc-700"
                }`}
              >
                {nome}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            {filtradas.length === 0 && (
              <div className="rounded-2xl bg-white p-8 text-center text-zinc-500">Nenhuma avaliação aqui ainda.</div>
            )}
            {filtradas.map((a) => (
              <div key={a.id} className="rounded-2xl border bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Estrelas nota={a.nota} />
                    <p className="mt-1 text-sm">
                      <strong>{a.nome || "Cliente"}</strong>
                      <span className="text-zinc-400"> · pedido {a.pedido_id} · {new Date(a.created_at).toLocaleDateString("pt-BR")}</span>
                    </p>
                  </div>
                  {a.comentario && (
                    <button
                      onClick={() => alternar(a)}
                      title={a.visivel ? "Esconder do cardápio" : "Mostrar no cardápio"}
                      className={`flex h-9 shrink-0 items-center gap-1 rounded-xl border px-3 text-xs font-semibold ${
                        a.visivel ? "text-zinc-700" : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {a.visivel ? <Eye size={14} /> : <EyeOff size={14} />}
                      {a.visivel ? "No cardápio" : "Escondido"}
                    </button>
                  )}
                </div>
                {a.comentario && <p className="mt-2 text-zinc-700">{a.comentario}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
