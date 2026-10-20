"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Minus, Plus, X } from "lucide-react";
import type { ProdutoFormatado } from "../types";
import { normalizarRegra, precosEfetivos } from "@/lib/precos";
import { precoAPartirDe, reais } from "@/lib/dinheiro";

type Adicional = { id?: string; nome: string; preco: number };

type ObrigatorioSelecionado = {
  id?: string;
  grupo: string;
  nome: string;
  descricao?: string;
  preco: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  product: ProdutoFormatado | null;
  corPrincipal: string;
  onAdd: (
    produto: ProdutoFormatado,
    observation?: string,
    adicionaisSelecionados?: Adicional[],
    obrigatoriosSelecionados?: ObrigatorioSelecionado[],
    quantidade?: number
  ) => void;
  /** Loja fechada: o cliente vê o produto, mas não adiciona. */
  bloqueado?: string;
  /** "Combina com": outros produtos para levar junto. */
  sugestoes?: ProdutoFormatado[];
  onEscolherSugestao?: (produto: ProdutoFormatado) => void;
};

/** Produto que vai direto para o carrinho (sem nada para escolher). */
export function semEscolhas(produto: any) {
  const grupos = (produto?.gruposObrigatorios ?? []).filter((g: any) => (g?.grupo_obrigatorio_opcoes ?? []).length > 0);
  return grupos.length === 0 && (produto?.adicionais ?? []).length === 0;
}

export default function ProductModal({
  open,
  onClose,
  product,
  onAdd,
  corPrincipal,
  bloqueado,
  sugestoes = [],
  onEscolherSugestao,
}: Props) {
  const [observacao, setObservacao] = useState("");
  const [adicionais, setAdicionais] = useState<Adicional[]>([]);
  const [escolhas, setEscolhas] = useState<Record<string, string[]>>({});
  const [quantidade, setQuantidade] = useState(1);
  const [faltando, setFaltando] = useState<string | null>(null);
  // "Combina com": itens marcados entram junto no carrinho (e no total).
  const [extras, setExtras] = useState<Record<string, number>>({});
  const corpoRef = useRef<HTMLDivElement>(null);
  const grupoRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const fecharRef = useRef(onClose);
  fecharRef.current = onClose;

  // Trava a rolagem da página por trás.
  useEffect(() => {
    if (!open) return;
    const y = window.scrollY;
    const s = document.body.style;
    s.position = "fixed";
    s.top = `-${y}px`;
    s.left = "0";
    s.right = "0";
    s.width = "100%";
    const fecharNoEsc = (e: KeyboardEvent) => e.key === "Escape" && fecharRef.current();
    window.addEventListener("keydown", fecharNoEsc);
    return () => {
      s.position = "";
      s.top = "";
      s.left = "";
      s.right = "";
      s.width = "";
      window.removeEventListener("keydown", fecharNoEsc);
      window.scrollTo(0, y);
    };
  }, [open]);

  // Produto novo: zera as escolhas.
  useEffect(() => {
    if (!open || !product) return;
    setObservacao("");
    setAdicionais([]);
    setEscolhas({});
    setQuantidade(1);
    setFaltando(null);
    setExtras({});
    corpoRef.current?.scrollTo({ top: 0 });
  }, [open, product]);

  const grupos = useMemo(
    () =>
      [...((product as any)?.gruposObrigatorios ?? [])]
        .filter((g: any) => (g?.grupo_obrigatorio_opcoes ?? []).length > 0)
        .sort((a: any, b: any) => (a.ordem ?? 0) - (b.ordem ?? 0))
        .map((g: any) => ({
          ...g,
          minimo: Number(g.minimo ?? 0),
          maximo: Number(g.maximo ?? 999),
          opcoes: [...(g.grupo_obrigatorio_opcoes ?? [])].sort((a: any, b: any) => (a.ordem ?? 0) - (b.ordem ?? 0)),
        })),
    [product]
  );

  // Preço de cada opção escolhida pela regra do grupo (ex.: meio a meio pelo mais caro).
  const precoPorOpcao = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const g of grupos) {
      const marcadas = g.opcoes.filter((o: any) => (escolhas[g.id] || []).includes(o.id));
      const ajustados = precosEfetivos(marcadas.map((o: any) => Number(o.preco)), normalizarRegra(g.regra_preco));
      marcadas.forEach((o: any, i: number) => mapa.set(String(o.id), ajustados[i]));
    }
    return mapa;
  }, [grupos, escolhas]);

  if (!open || !product) return null;

  const totalAdicionais = adicionais.reduce((t, a) => t + Number(a.preco || 0), 0);
  const totalOpcoes = [...precoPorOpcao.values()].reduce((t, v) => t + v, 0);
  const unitario = Number(product.preco || 0) + totalAdicionais + totalOpcoes;
  const outras = sugestoes.filter((s) => String(s.id) !== String(product.id)).slice(0, 6);
  const totalExtras = outras.reduce((t, x) => t + Number(x.preco || 0) * (extras[String(x.id)] || 0), 0);
  const total = unitario * quantidade + totalExtras;
  const aPartir = precoAPartirDe(product);
  const temPromocao = Number(product.precoAntigo) > Number(product.preco) && Number(product.preco) > 0;
  const descricao = String(product.descricao ?? "").trim();

  const completo = (g: any) => (escolhas[g.id] || []).length >= g.minimo;

  function escolher(g: any, opcaoId: string) {
    setFaltando(null);
    const atuais = escolhas[g.id] || [];
    let novos: string[];
    if (atuais.includes(opcaoId)) novos = atuais.filter((id) => id !== opcaoId);
    else if (g.maximo === 1) novos = [opcaoId]; // escolha única: troca na hora
    else if (g.maximo !== 999 && atuais.length >= g.maximo) return;
    else novos = [...atuais, opcaoId];

    const proximas: Record<string, string[]> = { ...escolhas, [g.id]: novos };
    setEscolhas(proximas);

    // Completou este grupo: leva até o próximo que falta.
    const ficouCompleto = novos.length >= Math.max(g.minimo, 1) && (g.maximo === 1 || novos.length === g.maximo);
    if (ficouCompleto) {
      const proximo = grupos.find((x: any) => x.id !== g.id && (proximas[x.id] || []).length < x.minimo);
      if (proximo) setTimeout(() => grupoRefs.current[proximo.id]?.scrollIntoView({ behavior: "smooth", block: "start" }), 180);
    }
  }

  function alternarAdicional(a: Adicional) {
    setAdicionais((lista) => (lista.some((x) => x.nome === a.nome) ? lista.filter((x) => x.nome !== a.nome) : [...lista, a]));
  }

  /** Confere as escolhas obrigatórias; se faltar algo, leva até lá. */
  function escolhasOk() {
    const pendente = grupos.find((g: any) => !completo(g));
    if (pendente) {
      setFaltando(pendente.id);
      grupoRefs.current[pendente.id]?.scrollIntoView({ behavior: "smooth", block: "start" });
      return false;
    }
    return true;
  }

  function adicionar(depois?: () => void) {
    if (bloqueado || !product) return;
    if (!escolhasOk()) return;

    const obrigatorios = grupos.flatMap((g: any) =>
      g.opcoes
        .filter((o: any) => (escolhas[g.id] || []).includes(o.id))
        .map((o: any) => ({
          id: o.id,
          grupo: g.nome,
          nome: o.nome,
          descricao: o.descricao || "",
          preco: precoPorOpcao.get(String(o.id)) ?? Number(o.preco),
        }))
    );

    if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
      (window as any).fbq("track", "AddToCart", {
        content_name: product.nome,
        content_ids: [String(product.id)],
        content_type: "product",
        value: total,
        currency: "BRL",
      });
    }

    onAdd(product, observacao.trim(), adicionais, obrigatorios, quantidade);
    for (const x of outras) {
      const qtd = extras[String(x.id)] || 0;
      if (qtd > 0) onAdd(x, "", [], [], qtd);
    }
    if (depois) depois();
    else onClose();
  }

  function tocarSugestao(x: ProdutoFormatado) {
    if (semEscolhas(x)) {
      const id = String(x.id);
      setExtras((e) => ({ ...e, [id]: e[id] ? 0 : 1 }));
      return;
    }
    // Tem opções (ex.: sabor do suco): guarda este produto e abre o outro.
    if (bloqueado) return onEscolherSugestao?.(x);
    adicionar(() => onEscolherSugestao?.(x));
  }

  const textoRegra = (g: any) => {
    const regra = g.regra_preco === "maior" ? "Cobrado pelo mais caro · " : g.regra_preco === "media" ? "Cobrado pela média · " : "";
    if (g.maximo === 1) return `${regra}Escolha 1`;
    if (g.maximo === 999) return `${regra}Escolha pelo menos ${g.minimo}`;
    if (g.minimo === g.maximo) return `${regra}Escolha ${g.minimo}`;
    if (g.minimo === 0) return `${regra}Escolha até ${g.maximo}`;
    return `${regra}Escolha de ${g.minimo} a ${g.maximo}`;
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/60 md:items-center md:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={product.nome}
    >
      <div
        className="relative flex h-[94dvh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[28px] bg-white text-zinc-900 shadow-2xl md:h-auto md:max-h-[90dvh] md:rounded-[28px]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-zinc-800 shadow-md"
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        <div ref={corpoRef} className="flex-1 overflow-y-auto overscroll-contain">
          {product.imagem ? (
            <div className="relative aspect-[4/3] w-full bg-zinc-100">
              <img src={product.imagem} alt={product.nome} className="h-full w-full object-cover" decoding="async" />
            </div>
          ) : (
            <div className="h-14" />
          )}

          <div className="px-5 pb-4 pt-5">
            <h2 className="pr-10 text-[22px] font-extrabold leading-tight">{product.nome}</h2>
            {descricao && descricao !== "0" && (
              <p className="mt-2 whitespace-pre-line text-[14px] leading-6 text-zinc-500">{descricao}</p>
            )}
            <div className="mt-3 flex items-baseline gap-2">
              {Number(product.preco) > 0 || aPartir.valor > 0 ? (
                <p className="text-xl font-extrabold" style={{ color: corPrincipal }}>
                  {aPartir.variavel && <span className="mr-1 text-sm font-semibold text-zinc-500">a partir de</span>}
                  {reais(aPartir.valor)}
                </p>
              ) : null}
              {temPromocao && <p className="text-sm text-zinc-400 line-through">{reais(product.precoAntigo)}</p>}
            </div>
          </div>

          {grupos.map((g: any) => {
            const marcadas = escolhas[g.id] || [];
            const ok = completo(g);
            const cheio = g.maximo !== 999 && g.maximo > 1 && marcadas.length >= g.maximo;
            const destaque = faltando === g.id;
            return (
              <div
                key={g.id}
                ref={(el) => {
                  grupoRefs.current[g.id] = el;
                }}
                className="scroll-mt-2"
              >
                <div
                  className={`sticky top-0 z-10 flex items-center justify-between gap-3 py-3 pl-5 pr-16 transition-colors ${
                    destaque ? "bg-red-50" : "bg-zinc-100"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold leading-tight">{g.nome}</p>
                    <p className={`mt-0.5 text-xs ${destaque ? "font-semibold text-red-600" : "text-zinc-500"}`}>
                      {destaque ? "Escolha aqui para continuar" : textoRegra(g)}
                      {g.maximo > 1 && g.maximo !== 999 ? ` · ${marcadas.length}/${g.maximo}` : ""}
                    </p>
                  </div>
                  {g.minimo > 0 &&
                    (ok ? (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <Check size={14} strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-md bg-zinc-800 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                        Obrigatório
                      </span>
                    ))}
                </div>

                <div className="divide-y divide-zinc-100">
                  {g.opcoes.map((o: any) => {
                    const marcada = marcadas.includes(o.id);
                    const desabilitada = !marcada && cheio;
                    const preco = Number(o.preco || 0);
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => escolher(g, o.id)}
                        disabled={desabilitada}
                        aria-pressed={marcada}
                        className={`flex w-full items-center gap-3 px-5 py-3.5 text-left transition ${desabilitada ? "opacity-40" : "active:bg-zinc-50"}`}
                      >
                        {o.imagem && <img src={o.imagem} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-xl object-cover" />}
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-medium leading-snug">{o.nome}</p>
                          {o.descricao && <p className="mt-0.5 text-xs leading-4 text-zinc-500">{o.descricao}</p>}
                          {preco > 0 && <p className="mt-0.5 text-sm font-semibold text-zinc-700">+ {reais(preco)}</p>}
                        </div>
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center border-2 ${g.maximo === 1 ? "rounded-full" : "rounded-md"}`}
                          style={{ borderColor: marcada ? corPrincipal : "#D4D4D8", backgroundColor: marcada ? corPrincipal : "white" }}
                        >
                          {marcada && <Check size={14} color="white" strokeWidth={3} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {(product.adicionais ?? []).length > 0 && (
            <div>
              <div className="sticky top-0 z-10 bg-zinc-100 py-3 pl-5 pr-16">
                <p className="text-[15px] font-bold">Adicionais</p>
                <p className="mt-0.5 text-xs text-zinc-500">Opcional</p>
              </div>
              <div className="divide-y divide-zinc-100">
                {(product.adicionais ?? []).map((a: any, i: number) => {
                  const marcado = adicionais.some((x) => x.nome === a.nome);
                  return (
                    <button
                      key={a.id ?? i}
                      type="button"
                      onClick={() => alternarAdicional(a)}
                      aria-pressed={marcado}
                      className="flex w-full items-center gap-3 px-5 py-3.5 text-left active:bg-zinc-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-medium">{a.nome}</p>
                        {a.descricao && <p className="mt-0.5 text-xs leading-4 text-zinc-500">{a.descricao}</p>}
                        {Number(a.preco) > 0 && <p className="mt-0.5 text-sm font-semibold text-zinc-700">+ {reais(a.preco)}</p>}
                      </div>
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2"
                        style={{ borderColor: marcado ? corPrincipal : "#D4D4D8", backgroundColor: marcado ? corPrincipal : "white" }}
                      >
                        {marcado && <Check size={14} color="white" strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="px-5 pb-6 pt-5">
            <label htmlFor="obs-produto" className="text-[15px] font-bold">
              Alguma observação?
            </label>
            <textarea
              id="obs-produto"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value.slice(0, 140))}
              placeholder="Ex.: sem cebola, molho à parte..."
              rows={2}
              className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-base outline-none focus:border-zinc-400"
            />
            <p className="mt-1 text-right text-[11px] text-zinc-400">{observacao.length}/140</p>
          </div>

          {outras.length > 0 && onEscolherSugestao && (
            <div className="pb-6">
              <p className="px-5 text-[15px] font-bold">Combina com</p>
              <p className="px-5 text-xs text-zinc-500">Toque para levar junto</p>
              <div className="scrollbar-hide mt-3 flex gap-3 overflow-x-auto px-5">
                {outras.map((x) => {
                  const marcado = (extras[String(x.id)] || 0) > 0;
                  const comOpcoes = !semEscolhas(x);
                  const preco = precoAPartirDe(x);
                  return (
                    <button
                      key={x.id}
                      type="button"
                      onClick={() => tocarSugestao(x)}
                      aria-pressed={marcado}
                      className="relative w-28 shrink-0 overflow-hidden rounded-2xl border-2 text-left transition"
                      style={{ borderColor: marcado ? corPrincipal : "#E4E4E7" }}
                    >
                      {x.imagem ? (
                        <img src={x.imagem} alt="" loading="lazy" className="h-20 w-full object-cover" />
                      ) : (
                        <div className="h-20 w-full" style={{ backgroundColor: `${corPrincipal}12` }} />
                      )}
                      <span
                        className="absolute right-1.5 top-[3.6rem] flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-white shadow"
                        style={{ backgroundColor: marcado ? "#059669" : corPrincipal }}
                      >
                        {marcado ? <Check size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={3} />}
                      </span>
                      <span className="line-clamp-2 block px-2 pt-1.5 text-xs font-semibold leading-4">{x.nome}</span>
                      <span className="block px-2 pb-2 text-xs font-bold" style={{ color: corPrincipal }}>
                        {comOpcoes ? "Escolher" : `+ ${reais(preco.valor)}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3 border-t border-zinc-200 bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          {bloqueado ? (
            <div className="w-full rounded-2xl bg-zinc-100 px-4 py-3 text-center text-sm font-semibold text-zinc-600">{bloqueado}</div>
          ) : (
            <>
              <div className="flex h-12 shrink-0 items-center rounded-2xl border border-zinc-200">
                <button
                  type="button"
                  aria-label="Diminuir"
                  onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                  className="flex h-12 w-11 items-center justify-center disabled:opacity-30"
                  disabled={quantidade <= 1}
                  style={{ color: corPrincipal }}
                >
                  <Minus size={18} strokeWidth={2.6} />
                </button>
                <span className="w-6 text-center text-base font-bold">{quantidade}</span>
                <button
                  type="button"
                  aria-label="Aumentar"
                  onClick={() => setQuantidade((q) => Math.min(99, q + 1))}
                  className="flex h-12 w-11 items-center justify-center"
                  style={{ color: corPrincipal }}
                >
                  <Plus size={18} strokeWidth={2.6} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => adicionar()}
                className="flex h-12 flex-1 items-center justify-between rounded-2xl px-4 text-[15px] font-bold text-white shadow-md transition active:scale-[0.98]"
                style={{ backgroundColor: corPrincipal }}
              >
                <span>{Object.values(extras).some((q) => q > 0) ? "Adicionar tudo" : "Adicionar"}</span>
                {total > 0 && <span>{reais(total)}</span>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
