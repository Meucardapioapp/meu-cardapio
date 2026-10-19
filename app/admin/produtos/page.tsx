"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, ImageOff, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Produto = {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  preco_antigo?: number | null;
  promocao?: boolean;
  imagem: string | null;
  categoria: string | null;
  ativo?: boolean;
  ordem?: number | null;
  created_at?: string;
  qtdAdicionais: number;
  qtdObrigatorios: number;
};

/** Mesma ordem do cardápio: posição escolhida pelo dono; sem posição, os mais novos primeiro. */
function ordenar<T extends { ordem?: number | null; created_at?: string }>(lista: T[]) {
  return [...lista].sort((a, b) => {
    const oa = a.ordem ?? Number.MAX_SAFE_INTEGER;
    const ob = b.ordem ?? Number.MAX_SAFE_INTEGER;
    if (oa !== ob) return oa - ob;
    return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
  });
}

const reais = (v: number) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [status, setStatus] = useState<"" | "ativo" | "inativo">("");
  const [excluir, setExcluir] = useState<Produto | null>(null);

  async function carregar() {
    const restauranteId = localStorage.getItem("restaurante_id");
    if (!restauranteId) return;

    const [{ data: lista }, { data: cats }] = await Promise.all([
      supabase
        .from("produtos")
        .select("*")
        .eq("restaurante_id", restauranteId)
        .order("ordem", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false }),
      supabase.from("categorias").select("nome").eq("restaurante_id", restauranteId).order("ordem", { ascending: true }),
    ]);

    const ids = (lista ?? []).map((p) => p.id);
    const [{ data: adicionais }, { data: grupos }] = ids.length
      ? await Promise.all([
          supabase.from("adicionais").select("produto_id").in("produto_id", ids),
          supabase.from("grupos_obrigatorios").select("produto_id").in("produto_id", ids),
        ])
      : [{ data: [] }, { data: [] }];

    const contar = (rows: { produto_id: string }[] | null, id: string) =>
      (rows ?? []).filter((r) => r.produto_id === id).length;

    setProdutos(
      ordenar(lista ?? []).map((p) => ({
        ...p,
        qtdAdicionais: contar(adicionais as any, p.id),
        qtdObrigatorios: contar(grupos as any, p.id),
      }))
    );
    setCategorias((cats ?? []).map((c) => c.nome));
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos.filter((p) => {
      if (termo && !`${p.nome} ${p.descricao ?? ""}`.toLowerCase().includes(termo)) return false;
      if (categoria && p.categoria !== categoria) return false;
      if (status === "ativo" && p.ativo === false) return false;
      if (status === "inativo" && p.ativo !== false) return false;
      return true;
    });
  }, [produtos, busca, categoria, status]);

  // Agrupa por categoria, na ordem das categorias do cardápio.
  const grupos = useMemo(() => {
    const mapa = new Map<string, Produto[]>();
    for (const c of categorias) mapa.set(c, []);
    for (const p of filtrados) {
      const c = p.categoria || "Sem categoria";
      if (!mapa.has(c)) mapa.set(c, []);
      mapa.get(c)!.push(p);
    }
    return [...mapa.entries()].filter(([, lista]) => lista.length > 0);
  }, [filtrados, categorias]);

  async function alternarAtivo(produto: Produto) {
    const novo = produto.ativo === false;
    setProdutos((lista) => lista.map((p) => (p.id === produto.id ? { ...p, ativo: novo } : p)));

    const { error } = await supabase.from("produtos").update({ ativo: novo }).eq("id", produto.id);

    if (error) {
      toast.error("Não foi possível atualizar.");
      carregar();
      return;
    }

    toast.success(novo ? "Produto visível no cardápio" : "Produto escondido (esgotado)");
  }

  async function confirmarExclusao() {
    if (!excluir) return;
    const id = excluir.id;

    const { data: gruposDoProduto } = await supabase.from("grupos_obrigatorios").select("id").eq("produto_id", id);
    const idsGrupos = (gruposDoProduto ?? []).map((g) => g.id);
    if (idsGrupos.length) await supabase.from("grupo_obrigatorio_opcoes").delete().in("grupo_id", idsGrupos);
    await supabase.from("grupos_obrigatorios").delete().eq("produto_id", id);
    await supabase.from("adicionais").delete().eq("produto_id", id);
    const { error } = await supabase.from("produtos").delete().eq("id", id);

    if (error) {
      toast.error("Não foi possível excluir o produto.");
      return;
    }

    setProdutos((lista) => lista.filter((p) => p.id !== id));
    setExcluir(null);
    toast.success("Produto excluído.");
  }

  const podeOrdenar = !busca.trim() && !status;

  /** Sobe ou desce o produto dentro da categoria e salva a nova ordem. */
  async function mover(produto: Produto, direcao: -1 | 1) {
    const nomeCategoria = produto.categoria || "Sem categoria";
    const daCategoria = produtos.filter((p) => (p.categoria || "Sem categoria") === nomeCategoria);
    const i = daCategoria.findIndex((p) => p.id === produto.id);
    const j = i + direcao;
    if (i < 0 || j < 0 || j >= daCategoria.length) return;

    const nova = [...daCategoria];
    [nova[i], nova[j]] = [nova[j], nova[i]];

    const novasPosicoes = new Map(nova.map((p, indice) => [p.id, indice]));
    const alterados = nova.filter((p, indice) => p.ordem !== indice);

    setProdutos((lista) =>
      ordenar(lista.map((p) => (novasPosicoes.has(p.id) ? { ...p, ordem: novasPosicoes.get(p.id)! } : p)))
    );

    const resultados = await Promise.all(
      alterados.map((p) =>
        supabase.from("produtos").update({ ordem: novasPosicoes.get(p.id) }).eq("id", p.id)
      )
    );

    if (resultados.some((r) => r.error)) {
      toast.error("Não foi possível salvar a ordem.");
      carregar();
    }
  }

  const totalAtivos = produtos.filter((p) => p.ativo !== false).length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">Editar Produtos</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {produtos.length} produtos · {totalAtivos} visíveis no cardápio
          </p>
        </div>
        <Link
          href="/admin/produtos/novo-produto"
          className="h-12 px-5 rounded-xl bg-[#6D1F2F] text-white font-bold flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Novo produto
        </Link>
      </div>

      {categorias.length === 0 && !carregando && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Antes de cadastrar produtos, crie as categorias do seu cardápio (ex.: Pizzas, Bebidas).{" "}
          <Link href="/admin/categorias" className="font-bold underline">Criar categorias</Link>
        </div>
      )}

      {/* Filtros */}
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_200px_160px]">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto"
            className="w-full h-11 rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-base"
          />
        </div>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-base"
        >
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-base"
        >
          <option value="">Todos</option>
          <option value="ativo">Visíveis</option>
          <option value="inativo">Escondidos</option>
        </select>
      </div>

      {carregando && (
        <div className="mt-6 grid gap-3 grid-cols-[repeat(auto-fill,minmax(min(100%,19rem),1fr))]">
          {[0, 1, 2].map((i) => <div key={i} className="h-28 rounded-2xl bg-white animate-pulse" />)}
        </div>
      )}

      {!carregando && produtos.length === 0 && (
        <div className="mt-6 rounded-2xl bg-white border p-8 text-center">
          <p className="text-lg font-bold">Seu cardápio ainda está vazio</p>
          <p className="text-zinc-500 mt-1">Cadastre o primeiro produto. Leva menos de 1 minuto.</p>
          <Link
            href="/admin/produtos/novo-produto"
            className="inline-flex mt-4 h-12 px-5 rounded-xl bg-[#6D1F2F] text-white font-bold items-center gap-2"
          >
            <Plus size={18} /> Cadastrar primeiro produto
          </Link>
        </div>
      )}

      {grupos.map(([nomeCategoria, lista]) => (
        <section key={nomeCategoria} className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-2">
            {nomeCategoria} <span className="text-zinc-400">({lista.length})</span>
            {podeOrdenar && lista.length > 1 && (
              <span className="ml-2 normal-case tracking-normal font-medium text-zinc-400">
                · use as setas para escolher quem aparece primeiro
              </span>
            )}
          </h2>

          {/* Colunas se ajustam à largura (zoom, tela grande ou pequena): cada cartão tem no mínimo 19rem. */}
          <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(min(100%,19rem),1fr))]">
            {lista.map((p, posicao) => {
              const ativo = p.ativo !== false;
              return (
                <div
                  key={p.id}
                  className={`min-w-0 rounded-2xl bg-white border p-3 flex flex-col gap-2 ${ativo ? "border-zinc-200" : "border-zinc-200 opacity-60"}`}
                >
                  <div className="flex gap-3 min-w-0">
                  {podeOrdenar && lista.length > 1 && (
                    <div className="flex flex-col justify-center gap-1 shrink-0 -ml-1">
                      <button
                        type="button"
                        onClick={() => mover(p, -1)}
                        disabled={posicao === 0}
                        aria-label={`Subir ${p.nome}`}
                        className="w-8 h-9 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-600 disabled:opacity-25"
                      >
                        <ChevronUp size={18} />
                      </button>
                      <span className="text-[11px] font-bold text-zinc-400 text-center">{posicao + 1}º</span>
                      <button
                        type="button"
                        onClick={() => mover(p, 1)}
                        disabled={posicao === lista.length - 1}
                        aria-label={`Descer ${p.nome}`}
                        className="w-8 h-9 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-600 disabled:opacity-25"
                      >
                        <ChevronDown size={18} />
                      </button>
                    </div>
                  )}

                  <Link href={`/admin/produtos/novo-produto?id=${p.id}`} className="shrink-0">
                    {p.imagem ? (
                      <img src={p.imagem} alt="" className="w-20 h-20 rounded-xl object-cover" />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400">
                        <ImageOff size={22} />
                      </div>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1 flex flex-col">
                    <Link href={`/admin/produtos/novo-produto?id=${p.id}`} className="min-w-0">
                      <p className="font-bold text-zinc-900 truncate">{p.nome}</p>
                      <p className="text-sm">
                        <span className="font-bold text-[#6D1F2F]">{reais(p.preco)}</span>
                        {p.promocao && p.preco_antigo ? (
                          <span className="ml-2 text-xs text-zinc-400 line-through">{reais(p.preco_antigo)}</span>
                        ) : null}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {p.qtdObrigatorios > 0 && `${p.qtdObrigatorios} escolha(s) obrigatória(s)`}
                        {p.qtdObrigatorios > 0 && p.qtdAdicionais > 0 && " · "}
                        {p.qtdAdicionais > 0 && `${p.qtdAdicionais} adicional(is)`}
                      </p>
                      {((p as any).estoque != null || (p as any).promo_preco) && (
                        <p className="text-xs mt-0.5 flex flex-wrap gap-1">
                          {(p as any).estoque != null && (
                            <span className={`rounded-full px-2 py-0.5 font-semibold ${Number((p as any).estoque) > 0 ? "bg-zinc-100 text-zinc-700" : "bg-red-100 text-red-700"}`}>
                              {Number((p as any).estoque) > 0 ? `Estoque: ${(p as any).estoque}` : "Esgotado (estoque 0)"}
                            </span>
                          )}
                          {(p as any).promo_preco && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">
                              Promoção {reais(Number((p as any).promo_preco))}
                            </span>
                          )}
                        </p>
                      )}
                    </Link>

                  </div>
                  </div>

                    <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-2">
                      <label className="flex items-center gap-2 text-xs font-semibold text-zinc-600 mr-auto cursor-pointer">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={ativo}
                          onClick={() => alternarAtivo(p)}
                          className={`relative w-10 h-6 rounded-full transition ${ativo ? "bg-green-500" : "bg-zinc-300"}`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${ativo ? "left-[18px]" : "left-0.5"}`} />
                        </button>
                        {ativo ? "Visível" : "Esgotado"}
                      </label>

                      <Link
                        href={`/admin/produtos/novo-produto?id=${p.id}`}
                        aria-label={`Editar ${p.nome}`}
                        className="h-9 px-3 rounded-lg border border-zinc-200 text-sm font-semibold flex items-center gap-1"
                      >
                        <Pencil size={14} /> Editar
                      </Link>
                      <button
                        onClick={() => setExcluir(p)}
                        aria-label={`Excluir ${p.nome}`}
                        className="h-9 w-9 rounded-lg border border-red-200 text-red-600 flex items-center justify-center"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {excluir && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-6" onClick={() => setExcluir(null)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black">Excluir “{excluir.nome}”?</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Se ele só acabou hoje, prefira desligar a chave “Visível”. Excluir não pode ser desfeito.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={() => setExcluir(null)} className="h-12 rounded-xl border font-semibold">Cancelar</button>
              <button onClick={confirmarExclusao} className="h-12 rounded-xl bg-red-600 text-white font-bold">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
