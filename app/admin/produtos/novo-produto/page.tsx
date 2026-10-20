"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { comprimirImagem } from "@/lib/imagem";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  HelpCircle,
  ListChecks,
  Loader2,
  Plus,
  PlusCircle,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { normalizarRegra, type RegraPreco } from "@/lib/precos";

/* ============================================================
   Tipos e utilidades
   ============================================================ */

type Opcao = { chave: string; nome: string; descricao: string; preco: string };

type Regra = "uma" | "ate" | "livre";

type Grupo = {
  chave: string;
  nome: string;
  regra: Regra;
  maximo: number; // usado quando regra = "ate"
  cobranca: RegraPreco; // como cobrar quando escolhe mais de uma (meio a meio)
  opcoes: Opcao[];
};

type Extra = { chave: string; nome: string; descricao: string; preco: string };

const novaChave = () => crypto.randomUUID();

/** "1990" → "19,90" enquanto digita (máscara de dinheiro). */
function mascaraDinheiro(valor: string) {
  const digitos = valor.replace(/\D/g, "").replace(/^0+/, "").slice(0, 9);
  if (!digitos) return "";
  const centavos = digitos.padStart(3, "0");
  const inteiro = centavos.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${inteiro},${centavos.slice(-2)}`;
}

function paraNumero(valor: string) {
  return Number(String(valor || "0").replace(/\./g, "").replace(",", ".")) || 0;
}

function paraTexto(valor: number | string | null | undefined) {
  const n = Number(valor || 0);
  return n ? mascaraDinheiro(n.toFixed(2).replace(".", "")) : "";
}

const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function regraDoBanco(minimo: number, maximo: number): { regra: Regra; maximo: number } {
  if (maximo >= 999) return { regra: "livre", maximo: 2 };
  if (minimo === 1 && maximo === 1) return { regra: "uma", maximo: 1 };
  return { regra: "ate", maximo: Math.max(2, maximo) };
}

function regraParaBanco(g: Grupo) {
  if (g.regra === "uma") return { minimo: 1, maximo: 1 };
  if (g.regra === "livre") return { minimo: 1, maximo: 999 };
  return { minimo: 1, maximo: Math.max(2, g.maximo) };
}

function textoRegra(g: Grupo) {
  if (g.regra === "uma") return "Escolha 1 opção";
  if (g.regra === "livre") return "Escolha pelo menos 1";
  return `Escolha de 1 até ${g.maximo}`;
}

const MODELOS = [
  { nome: "Escolha o tamanho", regra: "uma" as Regra, opcoes: ["Pequeno", "Médio", "Grande"] },
  { nome: "Escolha o sabor", regra: "uma" as Regra, opcoes: [] },
  { nome: "Meio a meio: escolha até 2 sabores", regra: "ate" as Regra, opcoes: [], cobranca: "maior" as RegraPreco },
  { nome: "Escolha a borda", regra: "uma" as Regra, opcoes: ["Sem borda", "Catupiry", "Cheddar"] },
  { nome: "Escolha a bebida", regra: "uma" as Regra, opcoes: [] },
  { nome: "Ponto da carne", regra: "uma" as Regra, opcoes: ["Mal passada", "Ao ponto", "Bem passada"] },
];

/* ============================================================
   Página
   ============================================================ */

export default function NovoProdutoPage() {
  return (
    <Suspense fallback={null}>
      <FormularioProduto />
    </Suspense>
  );
}

function FormularioProduto() {
  const produtoId = useSearchParams().get("id");

  const [carregando, setCarregando] = useState(Boolean(produtoId));
  const [salvando, setSalvando] = useState(false);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [categorias, setCategorias] = useState<string[]>([]);
  const [preco, setPreco] = useState("");
  const [promocao, setPromocao] = useState(false);
  const [precoAntigo, setPrecoAntigo] = useState("");
  // Opções avançadas (ficam fechadas para não confundir)
  const [avancado, setAvancado] = useState(false);
  const [colunasNovas, setColunasNovas] = useState(false);
  const [promoPreco, setPromoPreco] = useState("");
  const [promoDias, setPromoDias] = useState<number[]>([]);
  const [promoInicio, setPromoInicio] = useState("");
  const [promoFim, setPromoFim] = useState("");
  const [controlarEstoque, setControlarEstoque] = useState(false);
  const [estoque, setEstoque] = useState("");
  const [sugerir, setSugerir] = useState(false);
  const [imagemArquivo, setImagemArquivo] = useState<File | null>(null);
  const [imagemUrl, setImagemUrl] = useState("");
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [ajuda, setAjuda] = useState(false);
  const inputFoto = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function carregar() {
      const restauranteId = localStorage.getItem("restaurante_id");
      if (!restauranteId) return;

      // Categorias, produto, grupos e adicionais em uma rodada só.
      const [{ data: cats }, produtoRes, gruposRes, adicionaisRes] = await Promise.all([
        supabase
          .from("categorias")
          .select("nome")
          .eq("restaurante_id", restauranteId)
          .order("ordem", { ascending: true }),
        produtoId
          ? supabase.from("produtos").select("*").eq("id", produtoId).maybeSingle()
          : Promise.resolve({ data: null }),
        produtoId
          ? supabase
              .from("grupos_obrigatorios")
              .select("*, grupo_obrigatorio_opcoes(*)")
              .eq("produto_id", produtoId)
              .order("ordem")
          : Promise.resolve({ data: null }),
        produtoId
          ? supabase.from("adicionais").select("*").eq("produto_id", produtoId).order("nome")
          : Promise.resolve({ data: null }),
      ]);
      setCategorias((cats ?? []).map((c: any) => c.nome));

      if (!produtoId) {
        setCarregando(false);
        return;
      }

      const p: any = produtoRes.data;
      if (!p) {
        toast.error("Produto não encontrado.");
        setCarregando(false);
        return;
      }

      setNome(p.nome || "");
      setDescricao(p.descricao || "");
      setCategoria(p.categoria || "");
      setPreco(paraTexto(p.preco));
      setPromocao(Boolean(p.promocao));
      setPrecoAntigo(paraTexto(p.preco_antigo));
      setColunasNovas("promo_preco" in p);
      setPromoPreco(p.promo_preco ? paraTexto(p.promo_preco) : "");
      setPromoDias(Array.isArray(p.promo_dias) ? p.promo_dias.map(Number) : []);
      setPromoInicio(p.promo_inicio ? String(p.promo_inicio).slice(0, 5) : "");
      setPromoFim(p.promo_fim ? String(p.promo_fim).slice(0, 5) : "");
      setControlarEstoque(p.estoque != null);
      setEstoque(p.estoque != null ? String(p.estoque) : "");
      setSugerir(Boolean(p.sugerir_no_carrinho));
      if (p.promo_preco || p.estoque != null || p.sugerir_no_carrinho) setAvancado(true);
      setImagemUrl(p.imagem || "");

      const gs: any[] | null = gruposRes.data as any;
      const ads: any[] | null = adicionaisRes.data as any;

      setGrupos(
        (gs ?? []).map((g: any) => ({
          chave: novaChave(),
          nome: g.nome,
          ...regraDoBanco(Number(g.minimo ?? 1), Number(g.maximo ?? 1)),
          cobranca: normalizarRegra(g.regra_preco),
          opcoes: [...(g.grupo_obrigatorio_opcoes ?? [])]
            .sort((a: any, b: any) => (a.ordem ?? 0) - (b.ordem ?? 0))
            .map((o: any) => ({
              chave: novaChave(),
              nome: o.nome,
              descricao: o.descricao || "",
              preco: paraTexto(o.preco),
            })),
        }))
      );

      setExtras((ads ?? []).map((a: any) => ({ chave: novaChave(), nome: a.nome, descricao: a.descricao || "", preco: paraTexto(a.preco) })));
      setCarregando(false);
    }

    carregar();
  }, [produtoId]);

  const previewFoto = useMemo(
    () => (imagemArquivo ? URL.createObjectURL(imagemArquivo) : imagemUrl),
    [imagemArquivo, imagemUrl]
  );

  /* ---------- grupos ---------- */

  function adicionarGrupo(modelo?: (typeof MODELOS)[number]) {
    setGrupos((g) => [
      ...g,
      {
        chave: novaChave(),
        nome: modelo?.nome ?? "",
        regra: modelo?.regra ?? "uma",
        maximo: 2,
        cobranca: (modelo as any)?.cobranca ?? "soma",
        opcoes: (modelo?.opcoes.length ? modelo.opcoes : ["", ""]).map((nome) => ({
          chave: novaChave(),
          nome,
          descricao: "",
          preco: "",
        })),
      },
    ]);
  }

  function mudarGrupo(chave: string, campo: Partial<Grupo>) {
    setGrupos((g) => g.map((x) => (x.chave === chave ? { ...x, ...campo } : x)));
  }

  function mudarOpcao(grupo: string, opcao: string, campo: Partial<Opcao>) {
    setGrupos((g) =>
      g.map((x) =>
        x.chave === grupo
          ? { ...x, opcoes: x.opcoes.map((o) => (o.chave === opcao ? { ...o, ...campo } : o)) }
          : x
      )
    );
  }

  function adicionarOpcao(grupo: string) {
    setGrupos((g) =>
      g.map((x) =>
        x.chave === grupo
          ? { ...x, opcoes: [...x.opcoes, { chave: novaChave(), nome: "", descricao: "", preco: "" }] }
          : x
      )
    );
  }

  function removerOpcao(grupo: string, opcao: string) {
    setGrupos((g) =>
      g.map((x) => (x.chave === grupo ? { ...x, opcoes: x.opcoes.filter((o) => o.chave !== opcao) } : x))
    );
  }

  /* ---------- foto ---------- */

  function escolherFoto(arquivo: File | undefined) {
    if (!arquivo) return;
    if (!arquivo.type.startsWith("image/")) {
      toast.error("Escolha um arquivo de imagem (JPG, PNG ou WEBP).");
      return;
    }
    if (arquivo.size > 20 * 1024 * 1024) {
      toast.error("A foto pode ter no máximo 20 MB.");
      return;
    }
    setImagemArquivo(arquivo);
  }

  async function enviarFoto(original: File) {
    // Foto leve: o cardápio abre bem mais rápido no 4G.
    const arquivo = await comprimirImagem(original, { maxLado: 1200, qualidade: 0.8, nome: "produto" });
    const extensao = (arquivo.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const restauranteId = localStorage.getItem("restaurante_id");
    if (!restauranteId) throw new Error("Entre novamente para enviar fotos.");
    const caminho = `${restauranteId}/${crypto.randomUUID()}.${extensao}`;

    const { error } = await supabase.storage.from("products").upload(caminho, arquivo, {
      contentType: arquivo.type,
      // Nome único por foto: o celular do cliente pode guardar por 1 ano.
      cacheControl: "31536000",
      upsert: false,
    });

    if (error) throw new Error("Não foi possível enviar a foto.");

    return supabase.storage.from("products").getPublicUrl(caminho).data.publicUrl;
  }

  /* ---------- validação e salvar ---------- */

  function validar(): string | null {
    if (!nome.trim()) return "Dê um nome para o produto (passo 1).";
    if (!categoria) return "Escolha a categoria do produto (passo 1).";
    if (paraNumero(preco) <= 0) return "Informe o preço do produto (passo 1).";
    if (paraNumero(promoPreco) > 0 && paraNumero(promoPreco) >= paraNumero(preco)) {
      return "O preço da promoção precisa ser menor que o preço normal.";
    }
    if (promocao && paraNumero(precoAntigo) <= paraNumero(preco)) {
      return "Na promoção, o preço antigo precisa ser maior que o preço atual.";
    }

    for (const [i, g] of grupos.entries()) {
      const opcoesValidas = g.opcoes.filter((o) => o.nome.trim());
      if (!g.nome.trim()) return `Escreva a pergunta da escolha ${i + 1} (ex.: "Escolha o sabor").`;
      if (opcoesValidas.length === 0) return `A escolha "${g.nome}" precisa de pelo menos uma opção.`;
      if (g.regra === "ate" && g.maximo > opcoesValidas.length) {
        return `Em "${g.nome}" o cliente pode escolher até ${g.maximo}, mas só existem ${opcoesValidas.length} opções.`;
      }
    }

    for (const e of extras) {
      if (e.nome.trim() && paraNumero(e.preco) <= 0) return `Informe o preço do adicional "${e.nome}".`;
    }

    return null;
  }

  async function salvar() {
    const problema = validar();
    if (problema) {
      toast.error(problema);
      return;
    }

    const restauranteId = localStorage.getItem("restaurante_id");
    if (!restauranteId) return;

    setSalvando(true);

    try {
      const foto = imagemArquivo ? await enviarFoto(imagemArquivo) : imagemUrl;

      const dados = {
        nome: nome.trim(),
        descricao: descricao.trim(),
        categoria,
        preco: paraNumero(preco),
        preco_antigo: promocao ? paraNumero(precoAntigo) : null,
        promocao,
        imagem: foto || "",
      };

      // Campos novos (SQL 08): só vão quando usados ou quando o banco já tem as colunas.
      const usaNovos = colunasNovas || Boolean(paraNumero(promoPreco)) || controlarEstoque || sugerir;
      if (usaNovos) {
        Object.assign(dados, {
          promo_preco: paraNumero(promoPreco) > 0 ? paraNumero(promoPreco) : null,
          promo_dias: paraNumero(promoPreco) > 0 && promoDias.length ? promoDias : null,
          promo_inicio: paraNumero(promoPreco) > 0 && promoInicio && promoFim ? promoInicio : null,
          promo_fim: paraNumero(promoPreco) > 0 && promoInicio && promoFim ? promoFim : null,
          estoque: controlarEstoque ? Math.max(0, Math.floor(Number(estoque) || 0)) : null,
          sugerir_no_carrinho: sugerir,
        });
      }

      let id = produtoId;

      if (id) {
        const { error } = await supabase.from("produtos").update(dados).eq("id", id);
        if (error) throw error;

        const { data: antigos } = await supabase.from("grupos_obrigatorios").select("id").eq("produto_id", id);
        const idsAntigos = (antigos ?? []).map((g) => g.id);
        if (idsAntigos.length) await supabase.from("grupo_obrigatorio_opcoes").delete().in("grupo_id", idsAntigos);
        await supabase.from("grupos_obrigatorios").delete().eq("produto_id", id);
        await supabase.from("adicionais").delete().eq("produto_id", id);
      } else {
        const { data, error } = await supabase
          .from("produtos")
          .insert({ ...dados, restaurante_id: restauranteId, destaque: "normal", ativo: true })
          .select("id")
          .single();
        if (error) throw error;
        id = data.id;
      }

      for (const [ordem, g] of grupos.entries()) {
        const { data: grupoCriado, error } = await supabase
          .from("grupos_obrigatorios")
          .insert({
            produto_id: id,
            nome: g.nome.trim(),
            ordem,
            ...regraParaBanco(g),
            // só envia quando não é o padrão (funciona antes do SQL 08)
            ...(g.regra !== "uma" && g.cobranca !== "soma" ? { regra_preco: g.cobranca } : {}),
          })
          .select("id")
          .single();
        if (error) throw error;

        const opcoes = g.opcoes
          .filter((o) => o.nome.trim())
          .map((o, i) => ({
            grupo_id: grupoCriado.id,
            nome: o.nome.trim(),
            descricao: o.descricao.trim() || null,
            preco: paraNumero(o.preco),
            imagem: "",
            ordem: i,
          }));

        if (opcoes.length) {
          const { error: erroOpcoes } = await supabase.from("grupo_obrigatorio_opcoes").insert(opcoes);
          if (erroOpcoes) throw erroOpcoes;
        }
      }

      const extrasValidos = extras
        .filter((e) => e.nome.trim())
        .map((e) => ({
          produto_id: id,
          nome: e.nome.trim(),
          preco: paraNumero(e.preco),
          // Ingredientes só vão quando preenchidos (funciona mesmo antes do SQL 12).
          ...(e.descricao.trim() ? { descricao: e.descricao.trim().slice(0, 300) } : {}),
        }));

      if (extrasValidos.length) {
        const { error } = await supabase.from("adicionais").insert(extrasValidos);
        if (error) throw error;
      }

      toast.success(produtoId ? "Produto atualizado!" : "Produto criado! Ele já aparece no cardápio.");
      window.location.href = "/admin/produtos";
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message?.startsWith("Não foi") ? e.message : "Não foi possível salvar. Tente de novo.");
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-[#6D1F2F]" />
      </div>
    );
  }

  const precoAtual = paraNumero(preco);

  return (
    <div className="max-w-6xl mx-auto pb-28">
      <Link href="/admin/produtos" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600">
        <ArrowLeft size={16} /> Voltar para produtos
      </Link>

      <h1 className="mt-3 text-2xl sm:text-3xl font-black text-zinc-900">
        {produtoId ? "Editar produto" : "Novo produto"}
      </h1>
      <p className="text-sm text-zinc-500 mt-1">Preencha os passos abaixo. Ao lado você vê como o cliente vai ver.</p>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5 min-w-0">
          {/* PASSO 1 */}
          <section className="rounded-2xl bg-white border p-4 sm:p-6">
            <Passo numero={1} titulo="O básico" subtitulo="Foto, nome, preço e categoria." />

            <div className="mt-4 grid gap-4 sm:grid-cols-[140px_1fr]">
              <button
                type="button"
                onClick={() => inputFoto.current?.click()}
                className="relative w-36 sm:w-[140px] mx-auto sm:mx-0 aspect-square rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 overflow-hidden flex flex-col items-center justify-center text-zinc-500"
              >
                {previewFoto ? (
                  <>
                    <img src={previewFoto} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <span className="absolute bottom-2 left-2 right-2 rounded-lg bg-black/60 text-white text-xs py-1">
                      Trocar foto
                    </span>
                  </>
                ) : (
                  <>
                    <Camera size={28} />
                    <span className="mt-1 text-xs font-semibold">Adicionar foto</span>
                  </>
                )}
              </button>
              <input
                ref={inputFoto}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => escolherFoto(e.target.files?.[0])}
              />

              <div className="space-y-3 min-w-0">
                <Campo rotulo="Nome do produto">
                  <input
                    value={nome}
                    onChange={(e) => setNome(e.target.value.slice(0, 80))}
                    placeholder="Ex.: Pizza de Calabresa"
                    className="campo"
                  />
                </Campo>
                <Campo rotulo="Descrição (opcional)" dica="Ingredientes ou detalhes que ajudam o cliente a decidir.">
                  <textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value.slice(0, 300))}
                    placeholder="Ex.: Molho de tomate, mussarela, calabresa e cebola"
                    rows={2}
                    className="campo resize-none"
                  />
                </Campo>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Campo rotulo="Categoria">
                {categorias.length ? (
                  <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="campo">
                    <option value="">Escolha…</option>
                    {categorias.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                ) : (
                  <Link href="/admin/categorias" className="campo flex items-center text-[#6D1F2F] font-semibold">
                    + Criar categorias primeiro
                  </Link>
                )}
              </Campo>
              <Campo rotulo="Preço">
                <Dinheiro valor={preco} aoMudar={setPreco} />
              </Campo>
            </div>

            <label className="mt-4 flex items-center gap-3 rounded-xl bg-zinc-50 p-3 cursor-pointer">
              <input type="checkbox" checked={promocao} onChange={(e) => setPromocao(e.target.checked)} className="w-5 h-5" />
              <span className="text-sm">
                <strong>Está em promoção?</strong> Mostra o preço antigo riscado.
              </span>
            </label>
            {promocao && (
              <div className="mt-3 max-w-xs">
                <Campo rotulo="Preço antigo (riscado)">
                  <Dinheiro valor={precoAntigo} aoMudar={setPrecoAntigo} />
                </Campo>
              </div>
            )}
          </section>

          {/* OPÇÕES AVANÇADAS */}
          <section className="rounded-2xl bg-white border">
            <button
              type="button"
              onClick={() => setAvancado((v) => !v)}
              className="w-full flex items-center justify-between p-4 sm:px-6 text-left"
            >
              <span>
                <span className="block font-bold text-zinc-900">Mais opções (opcional)</span>
                <span className="block text-sm text-zinc-500">Promoção por dia e horário, estoque e “Peça também”.</span>
              </span>
              <span className="text-2xl text-zinc-400">{avancado ? "−" : "+"}</span>
            </button>

            {avancado && (
              <div className="px-4 pb-5 sm:px-6 space-y-5">
                <div>
                  <p className="font-semibold text-zinc-900">Promoção por dia e horário</p>
                  <p className="text-sm text-zinc-500">Ex.: terça da pizza, happy hour. Fora do dia/horário, volta ao preço normal sozinho.</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Campo rotulo="Preço na promoção">
                      <Dinheiro valor={promoPreco} aoMudar={setPromoPreco} />
                    </Campo>
                    <Campo rotulo="Das (opcional)">
                      <input type="time" value={promoInicio} onChange={(e) => setPromoInicio(e.target.value)} className="campo" />
                    </Campo>
                    <Campo rotulo="Até (opcional)">
                      <input type="time" value={promoFim} onChange={(e) => setPromoFim(e.target.value)} className="campo" />
                    </Campo>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d, i) => {
                      const ativo = promoDias.includes(i);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setPromoDias((l) => (ativo ? l.filter((x) => x !== i) : [...l, i].sort()))}
                          className={`h-10 px-3 rounded-full border-2 text-sm font-semibold ${
                            ativo ? "border-[#6D1F2F] bg-[#6D1F2F] text-white" : "border-zinc-200"
                          }`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">Sem dia marcado = vale todos os dias.</p>
                </div>

                <label className="flex items-start gap-3 rounded-xl bg-zinc-50 p-3 cursor-pointer">
                  <input type="checkbox" checked={controlarEstoque} onChange={(e) => setControlarEstoque(e.target.checked)} className="w-5 h-5 mt-0.5" />
                  <span className="flex-1 text-sm">
                    <strong>Controlar estoque</strong>
                    <span className="block text-zinc-500">Cada pedido desconta. Quando zerar, o produto some do cardápio sozinho.</span>
                    {controlarEstoque && (
                      <input
                        value={estoque}
                        onChange={(e) => setEstoque(e.target.value.replace(/\D/g, "").slice(0, 5))}
                        inputMode="numeric"
                        placeholder="Quantidade disponível"
                        className="campo mt-2 max-w-[220px] bg-white"
                      />
                    )}
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-xl bg-zinc-50 p-3 cursor-pointer">
                  <input type="checkbox" checked={sugerir} onChange={(e) => setSugerir(e.target.checked)} className="w-5 h-5 mt-0.5" />
                  <span className="text-sm">
                    <strong>Sugerir no carrinho (“Peça também”)</strong>
                    <span className="block text-zinc-500">Bom para bebidas e sobremesas: aparece no carrinho para o cliente adicionar com um toque.</span>
                  </span>
                </label>
              </div>
            )}
          </section>

          {/* PASSO 2 */}
          <section className="rounded-2xl bg-white border p-4 sm:p-6">
            <Passo
              numero={2}
              titulo="O cliente precisa escolher algo?"
              subtitulo="Use quando o produto só pode ser pedido depois de uma escolha. Se não precisa, pule este passo."
            />

            <button
              type="button"
              onClick={() => setAjuda((v) => !v)}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#6D1F2F]"
            >
              <HelpCircle size={16} /> {ajuda ? "Esconder exemplos" : "Ver exemplos"}
            </button>

            {ajuda && (
              <div className="mt-3 rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-900 space-y-1.5">
                <p><strong>Pizza:</strong> “Escolha o tamanho” (Broto, Média, Grande) e “Escolha a borda”.</p>
                <p><strong>Açaí:</strong> “Escolha até 3 complementos” (Granola, Leite em pó, Banana…).</p>
                <p><strong>Combo:</strong> “Escolha a bebida” (Coca, Guaraná, Suco).</p>
                <p>Se a opção não muda o preço, deixe o valor em branco. Se custa mais, coloque quanto a mais (ex.: Borda de Catupiry + R$ 8,00).</p>
              </div>
            )}

            <div className="mt-4 space-y-4">
              {grupos.map((g, i) => (
                <div key={g.chave} className="rounded-2xl border-2 border-zinc-200 p-3 sm:p-4">
                  <div className="flex items-start gap-2">
                    <span className="mt-2.5 text-xs font-black text-zinc-400 w-5 shrink-0">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <Campo rotulo="Pergunta para o cliente">
                        <input
                          value={g.nome}
                          onChange={(e) => mudarGrupo(g.chave, { nome: e.target.value.slice(0, 60) })}
                          placeholder='Ex.: "Escolha o sabor"'
                          className="campo"
                        />
                      </Campo>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGrupos((x) => x.filter((y) => y.chave !== g.chave))}
                      aria-label="Remover esta escolha"
                      className="mt-6 w-10 h-10 shrink-0 rounded-lg text-red-600 hover:bg-red-50 flex items-center justify-center"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <p className="mt-3 text-xs font-semibold text-zinc-600">Quantas opções o cliente escolhe?</p>
                  <div className="mt-1 grid gap-2 sm:grid-cols-3">
                    {(
                      [
                        ["uma", "Só 1", "Ex.: tamanho"],
                        ["ate", "Até um limite", "Ex.: até 2 sabores"],
                        ["livre", "Quantas quiser", "Ex.: complementos"],
                      ] as [Regra, string, string][]
                    ).map(([valor, titulo, exemplo]) => (
                      <button
                        key={valor}
                        type="button"
                        onClick={() => mudarGrupo(g.chave, { regra: valor })}
                        className={`rounded-xl border-2 px-3 py-2 text-left ${
                          g.regra === valor ? "border-[#6D1F2F] bg-[#6D1F2F]/5" : "border-zinc-200"
                        }`}
                      >
                        <span className="block text-sm font-bold">{titulo}</span>
                        <span className="block text-xs text-zinc-500">{exemplo}</span>
                      </button>
                    ))}
                  </div>

                  {g.regra === "ate" && (
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      Até
                      <select
                        value={g.maximo}
                        onChange={(e) => mudarGrupo(g.chave, { maximo: Number(e.target.value) })}
                        className="h-10 rounded-lg border px-2"
                      >
                        {[2, 3, 4, 5, 6, 8, 10].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                      opções
                    </div>
                  )}

                  {g.regra !== "uma" && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-zinc-600">Quando escolher mais de uma, como cobrar?</p>
                      <div className="mt-1 grid gap-2 sm:grid-cols-3">
                        {(
                          [
                            ["soma", "Somar tudo", "Ex.: complementos"],
                            ["maior", "Pela mais cara", "Ex.: pizza meio a meio"],
                            ["media", "Pela média", "Ex.: meio a meio pela média"],
                          ] as [RegraPreco, string, string][]
                        ).map(([valor, titulo, exemplo]) => (
                          <button
                            key={valor}
                            type="button"
                            onClick={() => mudarGrupo(g.chave, { cobranca: valor })}
                            className={`rounded-xl border-2 px-3 py-2 text-left ${
                              g.cobranca === valor ? "border-[#6D1F2F] bg-[#6D1F2F]/5" : "border-zinc-200"
                            }`}
                          >
                            <span className="block text-sm font-bold">{titulo}</span>
                            <span className="block text-xs text-zinc-500">{exemplo}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="mt-4 text-xs font-semibold text-zinc-600">Opções</p>
                  <div className="mt-1 space-y-2">
                    {g.opcoes.map((o) => (
                      <div key={o.chave} className="grid grid-cols-[1fr_auto] gap-2 rounded-xl bg-zinc-50 p-2">
                        <div className="grid gap-2 sm:grid-cols-[1fr_130px] min-w-0">
                          <input
                            value={o.nome}
                            onChange={(e) => mudarOpcao(g.chave, o.chave, { nome: e.target.value.slice(0, 60) })}
                            placeholder="Nome da opção"
                            className="campo bg-white"
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-zinc-500 shrink-0">+ R$</span>
                            <input
                              value={o.preco}
                              onChange={(e) => mudarOpcao(g.chave, o.chave, { preco: mascaraDinheiro(e.target.value) })}
                              inputMode="numeric"
                              placeholder="0,00"
                              className="campo bg-white"
                            />
                          </div>
                          <input
                            value={o.descricao}
                            onChange={(e) => mudarOpcao(g.chave, o.chave, { descricao: e.target.value.slice(0, 300) })}
                            placeholder="Ingredientes (opcional) — Ex.: massa, molho, muçarela, calabresa e cebola"
                            className="campo bg-white text-sm sm:col-span-2"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removerOpcao(g.chave, o.chave)}
                          aria-label="Remover opção"
                          className="w-10 h-10 rounded-lg text-zinc-500 hover:bg-white flex items-center justify-center"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => adicionarOpcao(g.chave)}
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#6D1F2F]"
                  >
                    <Plus size={16} /> Adicionar opção
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => adicionarGrupo()}
                className="w-full h-12 rounded-xl border-2 border-dashed border-[#6D1F2F]/40 text-[#6D1F2F] font-bold flex items-center justify-center gap-2"
              >
                <ListChecks size={18} /> {grupos.length ? "Adicionar outra escolha" : "Sim, o cliente precisa escolher algo"}
              </button>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs text-zinc-500 self-center">Atalhos:</span>
                {MODELOS.map((m) => (
                  <button
                    key={m.nome}
                    type="button"
                    onClick={() => adicionarGrupo(m)}
                    className="h-8 px-3 rounded-full bg-zinc-100 text-xs font-semibold"
                  >
                    {m.nome}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* PASSO 3 */}
          <section className="rounded-2xl bg-white border p-4 sm:p-6">
            <Passo
              numero={3}
              titulo="Adicionais (opcional)"
              subtitulo="Extras que o cliente pode colocar pagando a mais, se quiser. Ex.: Bacon + R$ 4,00."
            />

            <div className="mt-4 space-y-2">
              {extras.map((e) => (
                <div key={e.chave} className="rounded-xl bg-zinc-50 p-2 space-y-2">
                <div className="grid grid-cols-[1fr_120px_auto] gap-2 items-center">
                  <input
                    value={e.nome}
                    onChange={(ev) =>
                      setExtras((x) => x.map((y) => (y.chave === e.chave ? { ...y, nome: ev.target.value.slice(0, 60) } : y)))
                    }
                    placeholder="Ex.: Bacon"
                    className="campo min-w-0"
                  />
                  <Dinheiro
                    valor={e.preco}
                    aoMudar={(v) => setExtras((x) => x.map((y) => (y.chave === e.chave ? { ...y, preco: v } : y)))}
                  />
                  <button
                    type="button"
                    onClick={() => setExtras((x) => x.filter((y) => y.chave !== e.chave))}
                    aria-label="Remover adicional"
                    className="w-10 h-10 rounded-lg text-zinc-500 hover:bg-zinc-100 flex items-center justify-center"
                  >
                    <X size={18} />
                  </button>
                </div>
                <input
                  value={e.descricao}
                  onChange={(ev) =>
                    setExtras((x) => x.map((y) => (y.chave === e.chave ? { ...y, descricao: ev.target.value.slice(0, 300) } : y)))
                  }
                  placeholder="Ingredientes (opcional) — Ex.: bacon em cubos, cheddar"
                  className="campo bg-white text-sm w-full"
                />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setExtras((x) => [...x, { chave: novaChave(), nome: "", descricao: "", preco: "" }])}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#6D1F2F]"
            >
              <PlusCircle size={16} /> Adicionar adicional
            </button>
          </section>
        </div>

        {/* PRÉVIA */}
        <aside className="lg:sticky lg:top-6 h-fit">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Como o cliente vê</p>
          <div className="rounded-3xl bg-white border shadow-sm overflow-hidden">
            <div className="aspect-[4/3] bg-zinc-100 flex items-center justify-center text-zinc-400">
              {previewFoto ? <img src={previewFoto} alt="" className="w-full h-full object-cover" /> : <Camera size={32} />}
            </div>
            <div className="p-4">
              <p className="text-lg font-black">{nome || "Nome do produto"}</p>
              {descricao && <p className="text-sm text-zinc-500 mt-1">{descricao}</p>}
              <p className="mt-2">
                <span className="text-xl font-black text-[#6D1F2F]">{reais(precoAtual)}</span>
                {promocao && paraNumero(precoAntigo) > 0 && (
                  <span className="ml-2 text-sm text-zinc-400 line-through">{reais(paraNumero(precoAntigo))}</span>
                )}
              </p>

              {grupos.map((g) => (
                <div key={g.chave} className="mt-4">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm">{g.nome || "Pergunta"}</p>
                    <span className="text-[10px] font-semibold bg-red-50 text-red-500 px-2 py-0.5 rounded-full">Obrigatório</span>
                  </div>
                  <p className="text-xs text-zinc-500">{textoRegra(g)}</p>
                  {g.opcoes.filter((o) => o.nome.trim()).map((o) => (
                    <div key={o.chave} className="mt-1.5 flex justify-between gap-2 text-sm rounded-lg border px-3 py-2">
                      <span className="min-w-0">
                        {o.nome}
                        {o.descricao.trim() && <span className="block text-xs text-zinc-500">{o.descricao}</span>}
                      </span>
                      {paraNumero(o.preco) > 0 && <span className="text-zinc-500 shrink-0">+ {reais(paraNumero(o.preco))}</span>}
                    </div>
                  ))}
                </div>
              ))}

              {extras.some((e) => e.nome.trim()) && (
                <div className="mt-4">
                  <p className="font-bold text-sm">Adicionais</p>
                  {extras.filter((e) => e.nome.trim()).map((e) => (
                    <div key={e.chave} className="mt-1.5 flex justify-between gap-2 text-sm rounded-lg border px-3 py-2">
                      <span className="min-w-0">
                        + {e.nome}
                        {e.descricao.trim() && <span className="block text-xs text-zinc-500">{e.descricao}</span>}
                      </span>
                      <span className="text-zinc-500 shrink-0">{reais(paraNumero(e.preco))}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Barra de salvar */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 lg:left-72 z-[55] bg-white/95 backdrop-blur border-t p-3 lg:pr-48">
        <div className="max-w-6xl mx-auto flex gap-2">
          <Link href="/admin/produtos" className="h-12 px-4 rounded-xl border font-semibold flex items-center">
            Cancelar
          </Link>
          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="flex-1 h-12 rounded-xl bg-[#6D1F2F] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {salvando ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
            {salvando ? "Salvando…" : produtoId ? "Salvar alterações" : "Salvar produto"}
          </button>
        </div>
      </div>

      <style>{`
        .campo { width: 100%; height: 44px; border: 1px solid #e4e4e7; border-radius: 12px; padding: 0 12px; font-size: 16px; background: #fff; outline: none; }
        textarea.campo { height: auto; padding: 10px 12px; }
        .campo:focus { border-color: #6D1F2F; box-shadow: 0 0 0 3px rgba(109,31,47,.12); }
      `}</style>
    </div>
  );
}

/* ============================================================
   Componentes pequenos
   ============================================================ */

function Passo({ numero, titulo, subtitulo }: { numero: number; titulo: string; subtitulo: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-8 h-8 shrink-0 rounded-full bg-[#6D1F2F] text-white font-black flex items-center justify-center">
        {numero}
      </span>
      <div>
        <h2 className="text-lg font-black text-zinc-900 leading-tight">{titulo}</h2>
        <p className="text-sm text-zinc-500">{subtitulo}</p>
      </div>
    </div>
  );
}

function Campo({ rotulo, dica, children }: { rotulo: string; dica?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-zinc-600">{rotulo}</span>
      <div className="mt-1">{children}</div>
      {dica && <span className="block mt-1 text-xs text-zinc-400">{dica}</span>}
    </label>
  );
}

function Dinheiro({ valor, aoMudar }: { valor: string; aoMudar: (v: string) => void }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">R$</span>
      <input
        value={valor}
        onChange={(e) => aoMudar(mascaraDinheiro(e.target.value))}
        inputMode="numeric"
        placeholder="0,00"
        className="campo"
        style={{ paddingLeft: 36 }}
      />
    </div>
  );
}
