"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Loader2, Minus, Plus, Search, Send, Trash2, X } from "lucide-react";
import { normalizarRegra, precosEfetivos } from "@/lib/precos";

export type OpcaoSalao = { id: string; nome: string; preco: number };
export type GrupoSalao = { id: string; nome: string; minimo: number; maximo: number; regra: string; opcoes: OpcaoSalao[] };
export type ProdutoSalao = {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  adicionais: OpcaoSalao[];
  grupos: GrupoSalao[];
};

type Linha = {
  chave: string;
  produto: ProdutoSalao;
  quantidade: number;
  observacao: string;
  obrigatorios: (OpcaoSalao & { grupo: string; grupoId: string })[];
  adicionais: OpcaoSalao[];
};

/** Item no formato que o servidor recebe (o preço é recalculado lá). */
export type ItemEnviado = {
  id: string;
  quantity: number;
  observacao: string;
  adicionaisSelecionados: { id: string; nome: string }[];
  obrigatoriosSelecionados: { id: string; grupo: string; nome: string }[];
};

const COR = "#6D1F2F";
const reais = (v: number) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const temOpcoes = (p: ProdutoSalao) => p.grupos.length > 0 || p.adicionais.length > 0;
/** Tem escolha obrigatória (ex.: sabor): precisa abrir as opções antes de somar. */
const precisaEscolher = (p: ProdutoSalao) => p.grupos.some((g) => g.minimo > 0);

function precoDaLinha(l: Pick<Linha, "produto" | "obrigatorios" | "adicionais">) {
  let total = l.produto.preco + l.adicionais.reduce((s, a) => s + a.preco, 0);
  for (const g of l.produto.grupos) {
    const doGrupo = l.obrigatorios.filter((o) => o.grupoId === g.id).map((o) => o.preco);
    total += precosEfetivos(doGrupo, normalizarRegra(g.regra)).reduce((s, v) => s + v, 0);
  }
  return Math.round(total * 100) / 100;
}

const semAcento = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Cardápio do salão: lista simples (sem fotos) com preço ao lado.
 * Toque para somar; itens com opções abrem a escolha. Observação por item.
 */
export default function CardapioSalao({
  produtos,
  categorias,
  titulo,
  onVoltar,
  onEnviar,
}: {
  produtos: ProdutoSalao[];
  categorias: string[];
  titulo: string;
  onVoltar: () => void;
  onEnviar: (itens: ItemEnviado[]) => Promise<boolean>;
}) {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [escolhendo, setEscolhendo] = useState<ProdutoSalao | null>(null);
  const [revisando, setRevisando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const visiveis = useMemo(() => {
    const termo = semAcento(busca.trim());
    return produtos.filter(
      (p) => (!categoria || p.categoria === categoria) && (!termo || semAcento(`${p.nome} ${p.categoria}`).includes(termo))
    );
  }, [produtos, busca, categoria]);

  const porCategoria = useMemo(() => {
    const ordem = categorias.length ? categorias : [...new Set(produtos.map((p) => p.categoria))];
    return ordem
      .map((c) => ({ categoria: c, itens: visiveis.filter((p) => p.categoria === c) }))
      .filter((g) => g.itens.length);
  }, [visiveis, categorias, produtos]);

  const qtdDoProduto = (id: string) => linhas.filter((l) => l.produto.id === id).reduce((s, l) => s + l.quantidade, 0);
  const totalItens = linhas.reduce((s, l) => s + l.quantidade, 0);
  const totalValor = linhas.reduce((s, l) => s + precoDaLinha(l) * l.quantidade, 0);

  function somar(p: ProdutoSalao, delta: number) {
    setLinhas((atual) => {
      const simples = atual.find((l) => l.produto.id === p.id && !l.obrigatorios.length && !l.adicionais.length && !l.observacao);
      if (delta > 0) {
        if (simples) return atual.map((l) => (l === simples ? { ...l, quantidade: Math.min(99, l.quantidade + 1) } : l));
        return [...atual, { chave: `${p.id}-${Date.now()}`, produto: p, quantidade: 1, observacao: "", obrigatorios: [], adicionais: [] }];
      }
      // Diminuir: tira da última linha desse produto
      const ultima = [...atual].reverse().find((l) => l.produto.id === p.id);
      if (!ultima) return atual;
      return ultima.quantidade > 1
        ? atual.map((l) => (l === ultima ? { ...l, quantidade: l.quantidade - 1 } : l))
        : atual.filter((l) => l !== ultima);
    });
  }

  // "+" soma na hora; só abre as opções quando tem escolha obrigatória.
  function tocarProduto(p: ProdutoSalao) {
    if (precisaEscolher(p)) setEscolhendo(p);
    else somar(p, 1);
  }

  async function enviar() {
    if (!linhas.length || enviando) return;
    setEnviando(true);
    try {
      const ok = await onEnviar(
        linhas.map((l) => ({
          id: l.produto.id,
          quantity: l.quantidade,
          observacao: l.observacao.trim(),
          adicionaisSelecionados: l.adicionais.map((a) => ({ id: a.id, nome: a.nome })),
          obrigatoriosSelecionados: l.obrigatorios.map((o) => ({ id: o.id, grupo: o.grupo, nome: o.nome })),
        }))
      );
      if (ok) {
        setLinhas([]);
        setRevisando(false);
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-zinc-50">
      <div className="shrink-0 border-b bg-white">
        <div className="flex items-center gap-2 px-3 h-14">
          <button onClick={onVoltar} aria-label="Voltar" className="h-10 w-10 shrink-0 rounded-xl bg-zinc-100 flex items-center justify-center">
            <ArrowLeft size={20} />
          </button>
          <p className="min-w-0 flex-1 truncate text-lg font-black">{titulo}</p>
        </div>
        <div className="px-3 pb-2">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar no cardápio"
              className="h-11 w-full rounded-xl border bg-zinc-50 pl-10 pr-3 text-base"
            />
          </div>
        </div>
        <div className="overflow-x-auto scrollbar-hide px-3 pb-3">
          <div className="flex w-max gap-2">
            {["", ...categorias].map((c) => (
              <button
                key={c || "todas"}
                onClick={() => setCategoria(c)}
                className={`h-9 rounded-full px-4 text-sm font-semibold whitespace-nowrap ${categoria === c ? "text-white" : "bg-zinc-100 text-zinc-700"}`}
                style={categoria === c ? { backgroundColor: COR } : undefined}
              >
                {c || "Tudo"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-28">
        {porCategoria.length === 0 && <p className="p-8 text-center text-zinc-500">Nada encontrado.</p>}
        {porCategoria.map((g) => (
          <section key={g.categoria}>
            <p className="sticky top-0 z-[1] bg-zinc-50/95 px-4 pt-4 pb-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
              {g.categoria}
            </p>
            <div className="mx-3 divide-y rounded-2xl border bg-white">
              {g.itens.map((p) => {
                const qtd = qtdDoProduto(p.id);
                return (
                  <div key={p.id} className="flex min-h-14 items-center gap-2 pl-4 pr-2">
                    <button onClick={() => (temOpcoes(p) ? setEscolhendo(p) : somar(p, 1))} className="min-w-0 flex-1 py-3 text-left">
                      <p className="font-semibold leading-tight">{p.nome}</p>
                      {precisaEscolher(p) ? (
                        <p className="text-xs text-zinc-400">toque para escolher</p>
                      ) : temOpcoes(p) ? (
                        <p className="text-xs text-[#6D1F2F]">+ adicionais: toque no nome</p>
                      ) : null}
                    </button>
                    <p className="shrink-0 text-sm font-bold text-zinc-700">{p.preco > 0 ? reais(p.preco) : ""}</p>
                    {qtd > 0 && !precisaEscolher(p) ? (
                      <div className="flex shrink-0 items-center">
                        <button onClick={() => somar(p, -1)} aria-label="Menos" className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                          <Minus size={18} />
                        </button>
                        <span className="w-8 text-center text-lg font-black">{qtd}</span>
                        <button onClick={() => somar(p, 1)} aria-label="Mais" className="h-10 w-10 rounded-xl text-white flex items-center justify-center" style={{ backgroundColor: COR }}>
                          <Plus size={18} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => tocarProduto(p)}
                        aria-label={`Adicionar ${p.nome}`}
                        className="relative h-10 w-10 shrink-0 rounded-xl text-white flex items-center justify-center"
                        style={{ backgroundColor: COR }}
                      >
                        <Plus size={18} />
                        {qtd > 0 && (
                          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-amber-400 px-1 text-xs font-black text-zinc-900">{qtd}</span>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {totalItens > 0 && (
        <div className="absolute inset-x-0 bottom-0 border-t bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            onClick={() => setRevisando(true)}
            className="flex h-14 w-full items-center justify-between rounded-xl px-5 text-white font-black"
            style={{ backgroundColor: COR }}
          >
            <span>Ver pedido ({totalItens})</span>
            <span>{reais(totalValor)}</span>
          </button>
        </div>
      )}

      {escolhendo && (
        <EscolherOpcoes
          produto={escolhendo}
          onFechar={() => setEscolhendo(null)}
          onAdicionar={(linha) => {
            setLinhas((l) => [...l, linha]);
            setEscolhendo(null);
          }}
        />
      )}

      {revisando && (
        <div className="absolute inset-0 z-20 flex flex-col bg-zinc-50">
          <div className="flex h-14 shrink-0 items-center gap-2 border-b bg-white px-3">
            <button onClick={() => setRevisando(false)} aria-label="Voltar" className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center">
              <ArrowLeft size={20} />
            </button>
            <p className="flex-1 text-lg font-black">Conferir · {titulo}</p>
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 pb-32">
            {linhas.map((l) => (
              <div key={l.chave} className="rounded-2xl border bg-white p-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{l.produto.nome}</p>
                    {[...l.obrigatorios.map((o) => `${o.grupo}: ${o.nome}`), ...l.adicionais.map((a) => `+ ${a.nome}`)].map((t) => (
                      <p key={t} className="text-sm text-zinc-500">{t}</p>
                    ))}
                    <p className="text-sm font-semibold text-zinc-700">{reais(precoDaLinha(l) * l.quantidade)}</p>
                  </div>
                  <div className="flex shrink-0 items-center">
                    <button
                      onClick={() =>
                        setLinhas((ls) =>
                          l.quantidade > 1 ? ls.map((x) => (x === l ? { ...x, quantidade: x.quantidade - 1 } : x)) : ls.filter((x) => x !== l)
                        )
                      }
                      aria-label="Menos"
                      className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center"
                    >
                      {l.quantidade > 1 ? <Minus size={18} /> : <Trash2 size={16} className="text-red-600" />}
                    </button>
                    <span className="w-8 text-center text-lg font-black">{l.quantidade}</span>
                    <button
                      onClick={() => setLinhas((ls) => ls.map((x) => (x === l ? { ...x, quantidade: Math.min(99, x.quantidade + 1) } : x)))}
                      aria-label="Mais"
                      className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
                <input
                  value={l.observacao}
                  onChange={(e) => setLinhas((ls) => ls.map((x) => (x === l ? { ...x, observacao: e.target.value.slice(0, 140) } : x)))}
                  placeholder="Observação (ex.: sem cebola, bem passado)"
                  className="mt-2 h-11 w-full rounded-xl border bg-amber-50/50 px-3 text-base"
                />
              </div>
            ))}
            {!linhas.length && <p className="p-8 text-center text-zinc-500">Nenhum item.</p>}
          </div>
          <div className="absolute inset-x-0 bottom-0 border-t bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="mb-2 flex justify-between px-1 text-sm">
              <span className="text-zinc-500">{totalItens} itens</span>
              <span className="font-black">{reais(totalValor)}</span>
            </div>
            <button
              disabled={enviando || !linhas.length}
              onClick={enviar}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-green-600 text-lg font-black text-white disabled:opacity-60"
            >
              {enviando ? <Loader2 className="animate-spin" /> : <Send size={20} />} Enviar pedido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EscolherOpcoes({
  produto,
  onFechar,
  onAdicionar,
}: {
  produto: ProdutoSalao;
  onFechar: () => void;
  onAdicionar: (linha: Linha) => void;
}) {
  const [escolhas, setEscolhas] = useState<Record<string, string[]>>({});
  const [adicionais, setAdicionais] = useState<string[]>([]);
  const [observacao, setObservacao] = useState("");
  const [quantidade, setQuantidade] = useState(1);

  const obrigatorios = produto.grupos.flatMap((g) =>
    (escolhas[g.id] ?? []).map((id) => {
      const o = g.opcoes.find((x) => x.id === id)!;
      return { ...o, grupo: g.nome, grupoId: g.id };
    })
  );
  const adicionaisEscolhidos = produto.adicionais.filter((a) => adicionais.includes(a.id));
  const faltando = produto.grupos.find((g) => (escolhas[g.id]?.length ?? 0) < g.minimo);
  const preco = precoDaLinha({ produto, obrigatorios, adicionais: adicionaisEscolhidos });

  function alternar(g: GrupoSalao, id: string) {
    setEscolhas((atual) => {
      const lista = atual[g.id] ?? [];
      if (lista.includes(id)) return { ...atual, [g.id]: lista.filter((x) => x !== id) };
      if (g.maximo === 1) return { ...atual, [g.id]: [id] };
      if (g.maximo !== 999 && lista.length >= g.maximo) return atual;
      return { ...atual, [g.id]: [...lista, id] };
    });
  }

  return (
    <div className="absolute inset-0 z-30 flex items-end bg-black/40" onClick={onFechar}>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[92%] w-full flex-col rounded-t-3xl bg-white">
        <div className="flex items-start justify-between gap-3 border-b p-4">
          <div>
            <p className="text-lg font-black">{produto.nome}</p>
            {produto.preco > 0 && <p className="text-sm text-zinc-500">{reais(produto.preco)}</p>}
          </div>
          <button onClick={onFechar} aria-label="Fechar" className="h-9 w-9 shrink-0 rounded-full bg-zinc-100 flex items-center justify-center">
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {produto.grupos.map((g) => (
            <div key={g.id}>
              <p className="font-bold">
                {g.nome}{" "}
                <span className="text-xs font-semibold text-zinc-400">
                  {g.minimo > 0 ? "obrigatório" : "opcional"}
                  {g.maximo > 1 && g.maximo !== 999 ? ` · até ${g.maximo}` : ""}
                </span>
              </p>
              <div className="mt-2 space-y-1.5">
                {g.opcoes.map((o) => {
                  const marcado = (escolhas[g.id] ?? []).includes(o.id);
                  return (
                    <button
                      key={o.id}
                      onClick={() => alternar(g, o.id)}
                      className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border-2 px-3 text-left ${marcado ? "border-[#6D1F2F] bg-[#6D1F2F]/5" : "border-zinc-200"}`}
                    >
                      <span className="font-semibold">{o.nome}</span>
                      <span className="text-sm text-zinc-500">{o.preco > 0 ? `+ ${reais(o.preco)}` : ""}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {produto.adicionais.length > 0 && (
            <div>
              <p className="font-bold">Adicionais <span className="text-xs font-semibold text-zinc-400">opcional</span></p>
              <div className="mt-2 space-y-1.5">
                {produto.adicionais.map((a) => {
                  const marcado = adicionais.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => setAdicionais((l) => (marcado ? l.filter((x) => x !== a.id) : [...l, a.id]))}
                      className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border-2 px-3 text-left ${marcado ? "border-[#6D1F2F] bg-[#6D1F2F]/5" : "border-zinc-200"}`}
                    >
                      <span className="font-semibold">{a.nome}</span>
                      <span className="text-sm text-zinc-500">+ {reais(a.preco)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <input
            value={observacao}
            onChange={(e) => setObservacao(e.target.value.slice(0, 140))}
            placeholder="Observação (ex.: sem cebola)"
            className="h-12 w-full rounded-xl border px-3 text-base"
          />
        </div>
        <div className="flex gap-2 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center rounded-xl bg-zinc-100">
            <button onClick={() => setQuantidade((q) => Math.max(1, q - 1))} aria-label="Menos" className="h-14 w-11 flex items-center justify-center">
              <Minus size={18} />
            </button>
            <span className="w-6 text-center text-lg font-black">{quantidade}</span>
            <button onClick={() => setQuantidade((q) => Math.min(99, q + 1))} aria-label="Mais" className="h-14 w-11 flex items-center justify-center">
              <Plus size={18} />
            </button>
          </div>
          <button
            disabled={Boolean(faltando)}
            onClick={() =>
              onAdicionar({
                chave: `${produto.id}-${Date.now()}`,
                produto,
                quantidade,
                observacao,
                obrigatorios,
                adicionais: adicionaisEscolhidos,
              })
            }
            className="flex h-14 flex-1 items-center justify-center rounded-xl px-3 font-black text-white disabled:opacity-50"
            style={{ backgroundColor: COR }}
          >
            {faltando ? `Escolha: ${faltando.nome}` : `Adicionar ${reais(preco * quantidade)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
