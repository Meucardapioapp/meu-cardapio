"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Bike,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  ExternalLink,
  ImagePlus,
  Loader2,
  Palette,
  Pencil,
  Plus,
  ShoppingBag,
  Star,
  Tags,
  Trash2,
  Type,
  Wallet,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

/* ============================================================
   Tipos e constantes
   ============================================================ */

type Painel = "banner" | "logo" | "nome" | "cor" | "horarios" | "pedido" | "categorias";

const DIAS = [
  { id: "seg", nome: "Segunda" },
  { id: "ter", nome: "Terça" },
  { id: "qua", nome: "Quarta" },
  { id: "qui", nome: "Quinta" },
  { id: "sex", nome: "Sexta" },
  { id: "sab", nome: "Sábado" },
  { id: "dom", nome: "Domingo" },
] as const;

type DiaId = (typeof DIAS)[number]["id"];
type Horarios = Record<DiaId, { aberto: boolean; inicio: string; fim: string }>;

const CORES = [
  { cor: "#6D1F2F", nome: "Vinho" },
  { cor: "#B91C1C", nome: "Vermelho" },
  { cor: "#EA580C", nome: "Laranja" },
  { cor: "#CA8A04", nome: "Mostarda" },
  { cor: "#15803D", nome: "Verde" },
  { cor: "#0F766E", nome: "Petróleo" },
  { cor: "#1D4ED8", nome: "Azul" },
  { cor: "#6B21A8", nome: "Roxo" },
  { cor: "#BE185D", nome: "Rosa" },
  { cor: "#18181B", nome: "Preto" },
];

const ATALHOS: { id: Painel; nome: string; icone: typeof Camera }[] = [
  { id: "banner", nome: "Banner", icone: ImagePlus },
  { id: "logo", nome: "Logo", icone: Camera },
  { id: "nome", nome: "Nome", icone: Type },
  { id: "cor", nome: "Cor", icone: Palette },
  { id: "horarios", nome: "Horários", icone: Clock3 },
  { id: "pedido", nome: "Pedido mínimo", icone: Wallet },
  { id: "categorias", nome: "Categorias", icone: Tags },
];

const horariosVazios = (): Horarios =>
  Object.fromEntries(DIAS.map((d) => [d.id, { aberto: false, inicio: "18:00", fim: "23:00" }])) as Horarios;

function mascaraDinheiro(valor: string) {
  const digitos = valor.replace(/\D/g, "").replace(/^0+/, "").slice(0, 7);
  if (!digitos) return "";
  const c = digitos.padStart(3, "0");
  return `${c.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${c.slice(-2)}`;
}

const paraNumero = (v: string) => Number(String(v || "0").replace(/\./g, "").replace(",", ".")) || 0;
const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function statusAgora(h: Horarios) {
  const dias: DiaId[] = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
  const agora = new Date();
  const hoje = h[dias[agora.getDay()]];
  if (!hoje.aberto) return { aberto: false, texto: "Fechado hoje" };

  const minutos = agora.getHours() * 60 + agora.getMinutes();
  const [hi, mi] = hoje.inicio.split(":").map(Number);
  const [hf, mf] = hoje.fim.split(":").map(Number);
  const ini = hi * 60 + mi;
  const fim = hf * 60 + mf;
  const aberto = fim > ini ? minutos >= ini && minutos <= fim : minutos >= ini || minutos <= fim;

  return aberto
    ? { aberto: true, texto: `Fecha às ${hoje.fim}` }
    : { aberto: false, texto: `Abre às ${hoje.inicio}` };
}

/* ============================================================
   Página
   ============================================================ */

export default function AparenciaPage() {
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [alterado, setAlterado] = useState(false);
  const [painel, setPainel] = useState<Painel | null>(null);

  const [restauranteId, setRestauranteId] = useState("");
  const [slug, setSlug] = useState("");
  const [aparenciaId, setAparenciaId] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [cor, setCor] = useState("#6D1F2F");
  const [banner, setBanner] = useState("");
  const [logo, setLogo] = useState("");
  const [pedidoMinimo, setPedidoMinimo] = useState("");
  const [horarios, setHorarios] = useState<Horarios>(horariosVazios);
  const [enviando, setEnviando] = useState<"banner" | "logo" | null>(null);

  const [categorias, setCategorias] = useState<{ id: string; nome: string; ordem: number }[]>([]);
  const [produtos, setProdutos] = useState<{ nome: string; preco: number; imagem: string | null; categoria: string | null }[]>([]);
  const [taxaMinima, setTaxaMinima] = useState<number | null>(null);

  const inputBanner = useRef<HTMLInputElement>(null);
  const inputLogo = useRef<HTMLInputElement>(null);

  function marcar<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setAlterado(true);
    };
  }

  /* ---------- carregar ---------- */

  useEffect(() => {
    async function carregar() {
      // Sessão local (sem ida ao servidor de login): a tela abre mais rápido.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      const { data: rest } = await supabase
        .from("restaurantes")
        .select("id, slug, nome_restaurante")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!rest) return;

      setRestauranteId(String(rest.id));
      setSlug(rest.slug || "");

      const [{ data: ap }, { data: cats }, { data: prods }, { data: bairros }] = await Promise.all([
        supabase
          .from("aparencia")
          .select("*")
          .eq("restaurante_id", rest.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("categorias").select("id, nome, ordem").eq("restaurante_id", rest.id).order("ordem", { ascending: true }),
        supabase
          .from("produtos")
          .select("nome, preco, imagem, categoria")
          .eq("restaurante_id", rest.id)
          .eq("ativo", true)
          .limit(30),
        supabase.from("bairros_entrega").select("valor").eq("restaurante_id", rest.id),
      ]);

      setNome(ap?.nome_restaurante || rest.nome_restaurante || "");
      setCor(ap?.cor_primaria || "#6D1F2F");
      setBanner(ap?.banner_url || "");
      setLogo(ap?.logo_url || "");
      setPedidoMinimo(ap?.pedido_minimo ? mascaraDinheiro(Number(ap.pedido_minimo).toFixed(2).replace(".", "")) : "");
      setAparenciaId(ap?.id ?? null);

      if (ap) {
        const h = horariosVazios();
        for (const d of DIAS) {
          const inicio = ap[`horario_${d.id}_inicio`];
          const fim = ap[`horario_${d.id}_fim`];
          h[d.id] = inicio && fim ? { aberto: true, inicio, fim } : { aberto: false, inicio: "18:00", fim: "23:00" };
        }
        setHorarios(h);
      }

      setCategorias((cats ?? []).map((c, i) => ({ id: String(c.id), nome: c.nome, ordem: c.ordem ?? i })));
      setProdutos(prods ?? []);
      const valores = (bairros ?? []).map((b) => Number(b.valor)).filter((v) => !Number.isNaN(v));
      setTaxaMinima(valores.length ? Math.min(...valores) : null);
      setCarregando(false);
    }

    carregar();
  }, []);

  /* ---------- avisar antes de sair sem salvar ---------- */

  useEffect(() => {
    const aviso = (e: BeforeUnloadEvent) => {
      if (alterado) e.preventDefault();
    };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [alterado]);

  /* ---------- imagens ---------- */

  async function enviarImagem(tipo: "banner" | "logo", arquivo: File | undefined) {
    if (!arquivo) return;
    if (!arquivo.type.startsWith("image/")) return toast.error("Escolha uma imagem (JPG, PNG ou WEBP).");
    if (arquivo.size > 5 * 1024 * 1024) return toast.error("A imagem pode ter no máximo 5 MB.");

    setEnviando(tipo);

    try {
      const extensao = (arquivo.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const bucket = tipo === "banner" ? "banners" : "logos";
      // Cada restaurante só pode gravar na própria pasta (regra do Storage).
      const caminho = `${restauranteId}/${tipo}-${crypto.randomUUID()}.${extensao}`;

      const { error } = await supabase.storage.from(bucket).upload(caminho, arquivo, {
        contentType: arquivo.type,
        cacheControl: "3600",
      });
      if (error) throw error;

      const url = supabase.storage.from(bucket).getPublicUrl(caminho).data.publicUrl;
      if (tipo === "banner") marcar(setBanner)(url);
      else marcar(setLogo)(url);
      toast.success(tipo === "banner" ? "Banner trocado. Clique em Salvar para publicar." : "Logo trocada. Clique em Salvar para publicar.");
    } catch {
      toast.error("Não foi possível enviar a imagem.");
    } finally {
      setEnviando(null);
    }
  }

  /* ---------- categorias (salvam na hora) ---------- */

  async function criarCategoria(nomeNovo: string) {
    const limpo = nomeNovo.trim().slice(0, 40);
    if (!limpo) return;
    if (categorias.some((c) => c.nome.toLowerCase() === limpo.toLowerCase())) {
      return toast.error("Já existe uma categoria com esse nome.");
    }

    const { data, error } = await supabase
      .from("categorias")
      .insert({ nome: limpo, restaurante_id: restauranteId, ordem: categorias.length })
      .select("id, nome, ordem")
      .single();

    if (error) return toast.error("Não foi possível criar a categoria.");
    setCategorias((c) => [...c, { id: String(data.id), nome: data.nome, ordem: data.ordem ?? c.length }]);
  }

  async function renomearCategoria(id: string, nomeNovo: string) {
    const atual = categorias.find((c) => c.id === id);
    const limpo = nomeNovo.trim().slice(0, 40);
    if (!atual || !limpo || limpo === atual.nome) return;

    const { error } = await supabase.from("categorias").update({ nome: limpo }).eq("id", id);
    if (error) return toast.error("Não foi possível renomear.");

    // Os produtos guardam o nome da categoria: atualiza junto.
    await supabase
      .from("produtos")
      .update({ categoria: limpo })
      .eq("restaurante_id", restauranteId)
      .eq("categoria", atual.nome);

    setCategorias((c) => c.map((x) => (x.id === id ? { ...x, nome: limpo } : x)));
    setProdutos((p) => p.map((x) => (x.categoria === atual.nome ? { ...x, categoria: limpo } : x)));
    toast.success("Categoria renomeada.");
  }

  async function moverCategoria(id: string, direcao: -1 | 1) {
    const lista = [...categorias];
    const i = lista.findIndex((c) => c.id === id);
    const j = i + direcao;
    if (j < 0 || j >= lista.length) return;
    [lista[i], lista[j]] = [lista[j], lista[i]];
    const reordenada = lista.map((c, ordem) => ({ ...c, ordem }));
    setCategorias(reordenada);

    await Promise.all(
      reordenada.map((c) => supabase.from("categorias").update({ ordem: c.ordem }).eq("id", c.id))
    );
  }

  async function excluirCategoria(id: string) {
    const atual = categorias.find((c) => c.id === id);
    if (!atual) return;

    const usados = produtos.filter((p) => p.categoria === atual.nome).length;
    if (usados > 0) {
      return toast.error(`"${atual.nome}" tem ${usados} produto(s). Mude esses produtos de categoria antes de excluir.`);
    }

    const { error } = await supabase.from("categorias").delete().eq("id", id);
    if (error) return toast.error("Não foi possível excluir.");
    setCategorias((c) => c.filter((x) => x.id !== id));
  }

  /* ---------- salvar ---------- */

  async function salvar() {
    for (const d of DIAS) {
      const h = horarios[d.id];
      if (h.aberto && (!h.inicio || !h.fim)) {
        setPainel("horarios");
        return toast.error(`Preencha o horário de ${d.nome}.`);
      }
    }

    if (!nome.trim()) {
      setPainel("nome");
      return toast.error("Informe o nome do restaurante.");
    }

    setSalvando(true);

    const dados: Record<string, unknown> = {
      nome_restaurante: nome.trim().slice(0, 80),
      cor_primaria: /^#[0-9a-fA-F]{6}$/.test(cor) ? cor : "#6D1F2F",
      banner_url: banner || null,
      logo_url: logo || null,
      pedido_minimo: paraNumero(pedidoMinimo),
    };

    for (const d of DIAS) {
      const h = horarios[d.id];
      dados[`horario_${d.id}_inicio`] = h.aberto ? h.inicio : null;
      dados[`horario_${d.id}_fim`] = h.aberto ? h.fim : null;
    }

    const { data, error } = aparenciaId
      ? await supabase.from("aparencia").update(dados).eq("id", aparenciaId).select("id").single()
      : await supabase
          .from("aparencia")
          .insert({ ...dados, restaurante_id: restauranteId })
          .select("id")
          .single();

    setSalvando(false);

    if (error) {
      toast.error("Não foi possível salvar. Tente de novo.");
      return;
    }

    setAparenciaId(data.id);
    setAlterado(false);
    localStorage.setItem("cor-principal", String(dados.cor_primaria));
    toast.success("Pronto! Seu cardápio já está com a nova aparência.");
  }

  /* ---------- dados da prévia ---------- */

  const status = useMemo(() => statusAgora(horarios), [horarios]);
  const categoriaAtiva = categorias[0]?.nome;
  const produtosPrevia = useMemo(() => {
    const daCategoria = produtos.filter((p) => p.categoria === categoriaAtiva);
    const lista = daCategoria.length ? daCategoria : produtos;
    return lista.slice(0, 4);
  }, [produtos, categoriaAtiva]);

  if (carregando) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-[#6D1F2F]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-28">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">Editar Cardápio</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Toque em qualquer parte com o lápis azul para editar. O cardápio muda na hora.
          </p>
        </div>
        {slug && (
          <a href={`/${slug}`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#6D1F2F] inline-flex items-center gap-1">
            Ver cardápio publicado <ExternalLink size={14} />
          </a>
        )}
      </div>

      {/* Atalhos */}
      <div className="mt-4 -mx-4 px-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 w-max">
          {ATALHOS.map(({ id, nome: n, icone: Icone }) => (
            <button
              key={id}
              onClick={() => setPainel(id)}
              className={`h-10 px-3 rounded-full text-sm font-semibold flex items-center gap-1.5 border ${
                painel === id ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-700 border-zinc-200"
              }`}
            >
              <Icone size={15} /> {n}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[400px_1fr] items-start">
        {/* ===================== MOLDE DO CARDÁPIO ===================== */}
        <div className="mx-auto w-full max-w-[400px]">
          <div className="rounded-[2.2rem] border-[10px] border-zinc-900 bg-white shadow-2xl overflow-hidden">
            {/* Banner */}
            <Editavel ativo={painel} aoClicar={setPainel} alvo="banner" rotulo="banner" className="block w-full">
              <div
                className="relative h-40 w-full"
                style={{
                  background: banner
                    ? `url(${banner}) center/cover no-repeat`
                    : `linear-gradient(135deg, ${cor} 0%, ${cor}CC 55%, #111827 100%)`,
                }}
              >
                <div className="absolute inset-0 bg-black/45" />
                {!banner && (
                  <span className="absolute inset-0 flex items-center justify-center text-white/90 text-sm font-semibold gap-2">
                    <ImagePlus size={18} /> Toque para colocar uma foto de capa
                  </span>
                )}
                {enviando === "banner" && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2 className="animate-spin text-white" />
                  </span>
                )}
              </div>
            </Editavel>

            {/* Logo */}
            <div className="relative h-0">
              <div className="absolute left-1/2 -translate-x-1/2 -top-12 z-20">
                <Editavel ativo={painel} aoClicar={setPainel} alvo="logo" rotulo="logo" className="rounded-full">
                  <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                    {enviando === "logo" ? (
                      <Loader2 className="animate-spin text-zinc-400" />
                    ) : logo ? (
                      <img src={logo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[11px] text-zinc-400 font-semibold text-center px-2">Sua logo</span>
                    )}
                  </div>
                </Editavel>
              </div>
            </div>

            <div className="pt-14 px-4 text-center">
              <Editavel ativo={painel} aoClicar={setPainel} alvo="nome" rotulo="nome" className="inline-block px-2">
                <p className="text-lg font-black text-zinc-900">{nome || "Nome do restaurante"}</p>
              </Editavel>
            </div>

            {/* Informações */}
            <div className="mt-3 grid grid-cols-[repeat(4,minmax(0,1fr))] divide-x divide-zinc-200 px-2 pb-4 text-center">
              <div className="px-1">
                <Bike size={18} className="mx-auto text-zinc-500" />
                <p className="text-[10px] font-semibold mt-1">Delivery</p>
                <p className="text-[10px] text-zinc-500">{taxaMinima != null ? `a partir de ${reais(taxaMinima)}` : "—"}</p>
              </div>
              <Editavel ativo={painel} aoClicar={setPainel} alvo="horarios" rotulo="horários" className="px-1">
                <Clock3 size={18} className="mx-auto text-zinc-500" />
                <p className={`text-[10px] font-semibold mt-1 ${status.aberto ? "text-green-600" : "text-red-600"}`}>
                  {status.aberto ? "Aberto agora" : "Fechado"}
                </p>
                <p className="text-[10px] text-zinc-500">{status.texto}</p>
              </Editavel>
              <Editavel ativo={painel} aoClicar={setPainel} alvo="pedido" rotulo="pedido mínimo" className="px-1">
                <Wallet size={18} className="mx-auto text-zinc-500" />
                <p className="text-[10px] font-semibold mt-1">Pedido mínimo</p>
                <p className="text-[10px] text-zinc-500">{paraNumero(pedidoMinimo) ? reais(paraNumero(pedidoMinimo)) : "Sem mínimo"}</p>
              </Editavel>
              <div className="px-1">
                <Star size={18} className="mx-auto text-zinc-500" />
                <p className="text-[10px] font-semibold mt-1">Avaliação</p>
                <p className="text-[10px] text-zinc-500">4,9</p>
              </div>
            </div>

            {/* Categorias */}
            <div className="border-t px-3 py-3">
              <Editavel ativo={painel} aoClicar={setPainel} alvo="categorias" rotulo="categorias" className="block w-full">
                <div className="flex gap-2 overflow-hidden">
                  {(categorias.length ? categorias : [{ id: "x", nome: "Sua categoria", ordem: 0 }]).slice(0, 4).map((c, i) => (
                    <span
                      key={c.id}
                      className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold"
                      style={i === 0 ? { backgroundColor: cor, color: "white" } : { border: "1px solid #e4e4e7", color: "#3f3f46" }}
                    >
                      {c.nome.toUpperCase()}
                    </span>
                  ))}
                </div>
              </Editavel>
            </div>

            {/* Produtos de exemplo */}
            <div className="px-3 pb-3">
              <p className="text-sm font-black text-zinc-900">{(categoriaAtiva || "Sua categoria").toUpperCase()}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(produtosPrevia.length
                  ? produtosPrevia
                  : [
                      { nome: "Seu produto", preco: 29.9, imagem: null, categoria: null },
                      { nome: "Outro produto", preco: 19.9, imagem: null, categoria: null },
                    ]
                ).map((p, i) => (
                  <div key={i} className="rounded-xl border overflow-hidden">
                    <div className="aspect-[4/3] bg-zinc-100">
                      {p.imagem && <img src={p.imagem} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="p-2">
                      <p className="text-[11px] font-semibold truncate">{p.nome}</p>
                      <p className="text-[12px] font-black" style={{ color: cor }}>{reais(Number(p.preco))}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Barra do carrinho */}
            <Editavel ativo={painel} aoClicar={setPainel} alvo="cor" rotulo="cor principal" className="block w-full">
              <div className="flex items-center justify-between px-4 py-3 text-white" style={{ backgroundColor: cor }}>
                <span className="text-xs font-semibold flex items-center gap-2">
                  <ShoppingBag size={16} /> 1 item no carrinho
                </span>
                <span className="rounded-full bg-green-500 px-3 py-1 text-[11px] font-bold">Ver carrinho</span>
              </div>
            </Editavel>
          </div>
        </div>

        {/* ===================== PAINEL DE EDIÇÃO ===================== */}
        <div className="lg:sticky lg:top-6">
          {!painel && (
            <div className="hidden lg:block rounded-2xl border-2 border-dashed border-zinc-300 p-8 text-center text-zinc-500">
              <Pencil className="mx-auto mb-2" />
              Clique em uma parte do cardápio (ou nos botões acima) para editar.
            </div>
          )}

          {painel && (
            <>
              <div className="lg:hidden fixed inset-0 z-[70] bg-black/40" onClick={() => setPainel(null)} />
              <div className="fixed lg:static inset-x-0 bottom-0 z-[75] max-h-[75vh] overflow-y-auto rounded-t-3xl lg:rounded-2xl bg-white border p-5 shadow-2xl lg:shadow-none pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-lg font-black">{ATALHOS.find((a) => a.id === painel)?.nome}</p>
                  <button onClick={() => setPainel(null)} aria-label="Fechar" className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center">
                    <X size={18} />
                  </button>
                </div>

                {painel === "banner" && (
                  <PainelImagem
                    descricao="Foto de capa no topo do cardápio. Use uma foto horizontal bonita dos seus pratos (1200×500 fica ótimo)."
                    temImagem={Boolean(banner)}
                    enviando={enviando === "banner"}
                    aoEscolher={() => inputBanner.current?.click()}
                    aoRemover={() => marcar(setBanner)("")}
                  />
                )}

                {painel === "logo" && (
                  <PainelImagem
                    descricao="Aparece no círculo do cardápio e na aba do navegador. Imagem quadrada funciona melhor."
                    temImagem={Boolean(logo)}
                    enviando={enviando === "logo"}
                    aoEscolher={() => inputLogo.current?.click()}
                    aoRemover={() => marcar(setLogo)("")}
                  />
                )}

                {painel === "nome" && (
                  <label className="block">
                    <span className="text-sm text-zinc-600">Como seu restaurante aparece para os clientes</span>
                    <input
                      autoFocus
                      value={nome}
                      onChange={(e) => marcar(setNome)(e.target.value.slice(0, 80))}
                      className="mt-2 w-full h-12 rounded-xl border px-3 text-base"
                    />
                  </label>
                )}

                {painel === "cor" && (
                  <div>
                    <p className="text-sm text-zinc-600">Usada nos botões, preços e categorias.</p>
                    <div className="mt-3 grid grid-cols-5 gap-3">
                      {CORES.map((c) => (
                        <button
                          key={c.cor}
                          onClick={() => marcar(setCor)(c.cor)}
                          className="flex flex-col items-center gap-1"
                          aria-label={c.nome}
                        >
                          <span
                            className="w-11 h-11 rounded-full flex items-center justify-center ring-offset-2"
                            style={{ backgroundColor: c.cor, boxShadow: cor === c.cor ? `0 0 0 3px white, 0 0 0 5px ${c.cor}` : undefined }}
                          >
                            {cor === c.cor && <Check size={18} color="white" />}
                          </span>
                          <span className="text-[11px] text-zinc-600">{c.nome}</span>
                        </button>
                      ))}
                    </div>
                    <label className="mt-4 flex items-center gap-3 text-sm">
                      Outra cor:
                      <input type="color" value={cor} onChange={(e) => marcar(setCor)(e.target.value)} className="w-12 h-10 rounded" />
                    </label>
                  </div>
                )}

                {painel === "pedido" && (
                  <label className="block">
                    <span className="text-sm text-zinc-600">Valor mínimo em produtos para aceitar o pedido. Deixe vazio para não ter mínimo.</span>
                    <div className="relative mt-2">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">R$</span>
                      <input
                        autoFocus
                        value={pedidoMinimo}
                        onChange={(e) => marcar(setPedidoMinimo)(mascaraDinheiro(e.target.value))}
                        inputMode="numeric"
                        placeholder="0,00"
                        className="w-full h-12 rounded-xl border pl-10 pr-3 text-base"
                      />
                    </div>
                  </label>
                )}

                {painel === "horarios" && (
                  <div>
                    <p className="text-sm text-zinc-600">Fora desses horários o cardápio mostra “Fechado” e não aceita pedidos.</p>
                    <div className="mt-3 divide-y">
                      {DIAS.map((d) => {
                        const h = horarios[d.id];
                        const mudar = (campo: Partial<Horarios[DiaId]>) =>
                          marcar(setHorarios)({ ...horarios, [d.id]: { ...h, ...campo } });
                        return (
                          <div key={d.id} className="py-2.5 flex flex-wrap items-center gap-2">
                            <span className="w-20 font-semibold text-sm">{d.nome}</span>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={h.aberto}
                              onClick={() => mudar({ aberto: !h.aberto })}
                              className={`relative w-11 h-6 rounded-full transition ${h.aberto ? "bg-green-500" : "bg-zinc-300"}`}
                            >
                              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${h.aberto ? "left-[22px]" : "left-0.5"}`} />
                            </button>
                            {h.aberto ? (
                              <span className="flex items-center gap-1.5 text-sm ml-auto">
                                <input type="time" value={h.inicio} onChange={(e) => mudar({ inicio: e.target.value })} className="h-10 rounded-lg border px-2 text-base" />
                                até
                                <input type="time" value={h.fim} onChange={(e) => mudar({ fim: e.target.value })} className="h-10 rounded-lg border px-2 text-base" />
                              </span>
                            ) : (
                              <span className="ml-auto text-sm text-zinc-400">Fechado</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const seg = horarios.seg;
                        const novos = { ...horarios };
                        for (const d of DIAS) novos[d.id] = { ...seg };
                        marcar(setHorarios)(novos);
                        toast.success("Horário de segunda copiado para todos os dias.");
                      }}
                      className="mt-3 text-sm font-semibold text-[#6D1F2F]"
                    >
                      Copiar o horário de segunda para todos os dias
                    </button>
                  </div>
                )}

                {painel === "categorias" && (
                  <PainelCategorias
                    categorias={categorias}
                    produtos={produtos}
                    aoCriar={criarCategoria}
                    aoRenomear={renomearCategoria}
                    aoMover={moverCategoria}
                    aoExcluir={excluirCategoria}
                  />
                )}

                <button
                  onClick={() => setPainel(null)}
                  className="lg:hidden mt-5 w-full h-12 rounded-xl bg-zinc-900 text-white font-semibold"
                >
                  Ver como ficou
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <input ref={inputBanner} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => enviarImagem("banner", e.target.files?.[0])} />
      <input ref={inputLogo} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => enviarImagem("logo", e.target.files?.[0])} />

      {/* Barra de salvar */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 lg:left-72 z-[55] bg-white/95 backdrop-blur border-t p-3 lg:pr-48">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <p className="hidden sm:block text-sm text-zinc-500 flex-1">
            {alterado ? "Você tem alterações que ainda não foram publicadas." : "Tudo salvo. Categorias são salvas na hora."}
          </p>
          <button
            onClick={salvar}
            disabled={salvando || !alterado}
            className="flex-1 sm:flex-none sm:px-8 h-12 rounded-xl bg-[#6D1F2F] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {salvando ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            {salvando ? "Salvando…" : alterado ? "Salvar e publicar" : "Salvo"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Área clicável do molde, com o lápis azul. */
function Editavel({
  alvo,
  ativo,
  aoClicar,
  className = "",
  children,
  rotulo,
}: {
  alvo: Painel;
  ativo: Painel | null;
  aoClicar: (alvo: Painel) => void;
  className?: string;
  children: React.ReactNode;
  rotulo: string;
}) {
  return (
    <button
      type="button"
      onClick={() => aoClicar(alvo)}
      aria-label={`Editar ${rotulo}`}
      className={`group relative text-left outline-none ${className} ${
        ativo === alvo ? "ring-2 ring-offset-2 ring-sky-500 rounded-xl" : ""
      }`}
    >
      {children}
      <span className="pointer-events-none absolute -top-2 -right-2 z-30 flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-white shadow ring-2 ring-white">
        <Pencil size={12} />
      </span>
    </button>
  );
}

/* ============================================================
   Painéis auxiliares
   ============================================================ */

function PainelImagem({
  descricao,
  temImagem,
  enviando,
  aoEscolher,
  aoRemover,
}: {
  descricao: string;
  temImagem: boolean;
  enviando: boolean;
  aoEscolher: () => void;
  aoRemover: () => void;
}) {
  return (
    <div>
      <p className="text-sm text-zinc-600">{descricao}</p>
      <div className="mt-4 flex gap-2">
        <button
          onClick={aoEscolher}
          disabled={enviando}
          className="flex-1 h-12 rounded-xl bg-[#6D1F2F] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {enviando ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
          {temImagem ? "Trocar imagem" : "Escolher imagem"}
        </button>
        {temImagem && (
          <button onClick={aoRemover} className="h-12 px-4 rounded-xl border border-red-200 text-red-600 font-semibold">
            Remover
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-zinc-400">JPG, PNG ou WEBP até 5 MB.</p>
    </div>
  );
}

function PainelCategorias({
  categorias,
  produtos,
  aoCriar,
  aoRenomear,
  aoMover,
  aoExcluir,
}: {
  categorias: { id: string; nome: string }[];
  produtos: { categoria: string | null }[];
  aoCriar: (nome: string) => Promise<unknown>;
  aoRenomear: (id: string, nome: string) => Promise<unknown>;
  aoMover: (id: string, direcao: -1 | 1) => Promise<unknown>;
  aoExcluir: (id: string) => Promise<unknown>;
}) {
  const [nova, setNova] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [texto, setTexto] = useState("");

  return (
    <div>
      <p className="text-sm text-zinc-600">Organize os grupos do seu cardápio. Use as setas para mudar a ordem.</p>

      <div className="mt-3 space-y-2">
        {categorias.map((c, i) => {
          const qtd = produtos.filter((p) => p.categoria === c.nome).length;
          return (
            <div key={c.id} className="flex items-center gap-2 rounded-xl border p-2">
              <div className="flex flex-col">
                <button onClick={() => aoMover(c.id, -1)} disabled={i === 0} aria-label="Subir" className="h-6 w-7 flex items-center justify-center disabled:opacity-30">
                  <ChevronUp size={16} />
                </button>
                <button onClick={() => aoMover(c.id, 1)} disabled={i === categorias.length - 1} aria-label="Descer" className="h-6 w-7 flex items-center justify-center disabled:opacity-30">
                  <ChevronDown size={16} />
                </button>
              </div>

              {editando === c.id ? (
                <input
                  autoFocus
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onBlur={async () => {
                    await aoRenomear(c.id, texto);
                    setEditando(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  className="flex-1 min-w-0 h-10 rounded-lg border px-2 text-base"
                />
              ) : (
                <button
                  onClick={() => {
                    setEditando(c.id);
                    setTexto(c.nome);
                  }}
                  className="flex-1 min-w-0 text-left"
                >
                  <span className="block font-semibold truncate">{c.nome}</span>
                  <span className="block text-xs text-zinc-500">{qtd} produto(s) · toque para renomear</span>
                </button>
              )}

              <button onClick={() => aoExcluir(c.id)} aria-label={`Excluir ${c.nome}`} className="h-9 w-9 rounded-lg text-red-600 hover:bg-red-50 flex items-center justify-center">
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          await aoCriar(nova);
          setNova("");
        }}
      >
        <input
          value={nova}
          onChange={(e) => setNova(e.target.value)}
          placeholder="Nova categoria (ex.: Bebidas)"
          className="flex-1 min-w-0 h-11 rounded-xl border px-3 text-base"
        />
        <button className="h-11 px-4 rounded-xl bg-[#6D1F2F] text-white font-semibold flex items-center gap-1">
          <Plus size={16} /> Criar
        </button>
      </form>
    </div>
  );
}
