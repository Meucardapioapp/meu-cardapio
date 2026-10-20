"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { guardarCardapio } from "@/lib/cardapio-cliente";
import { useParams, useRouter } from "next/navigation";
import { Bike, Clock3, Search, ShoppingBag, Star, Ticket, X } from "lucide-react";

import SplashScreen from "../components/SplashScreen";
import ProductCard from "../components/ProductCard";
import FeaturedProductCard from "../components/FeaturedProductCard";
import ProductModal, { semEscolhas } from "../components/ProductModal";
import BottomNavigation from "../components/BottomNavigation";
import RestaurantFooter from "../components/RestaurantFooter";
import { useRestaurant } from "@/contexts/RestaurantContext";
import type { Adicional, CartItem, ProdutoFormatado } from "../types";
import { agoraNoFuso, statusDaLoja } from "@/lib/horario";
import { paraUF } from "@/lib/uf";
import { reais, semAcento } from "@/lib/dinheiro";
import {
  conferirComCardapio,
  lerCarrinho,
  precoUnitario,
  quantidadeCarrinho,
  salvarCarrinho,
  totalCarrinho,
} from "@/lib/carrinho";

type Props = {
  /** Dados já carregados no servidor: o cardápio aparece sem tela de carregamento. */
  inicial?: any;
};

/** Categoria que vira faixa de destaques (rolagem para o lado). */
const DESTAQUE = /destaque|promo|oferta|mais vendid|recomend|combo do dia|do dia/i;

const idCategoria = (nome: string) =>
  "categoria-" +
  semAcento(nome)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export default function CardapioClient({ inicial }: Props) {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { logo, corPrincipal } = useRestaurant();

  const [dados, setDados] = useState<any>(inicial ?? null);
  const [carregando, setCarregando] = useState(!inicial);
  const restaurante = dados?.restaurante ?? null;
  const aparencia = dados?.aparencia ?? null;
  const produtos: ProdutoFormatado[] = dados?.produtos ?? [];
  const categorias: string[] = dados?.categorias ?? [];
  const tempos = dados?.operacao ?? null;
  const avaliacao = dados?.avaliacao ?? null;
  const taxaMinima: number | null = dados?.taxaMinima ?? null;
  const pedidosPausados = dados ? dados.pedidosAtivos === false : false;

  // Hora no fuso do restaurante (o celular do cliente pode estar em outro fuso).
  const [agora, setAgora] = useState<ReturnType<typeof agoraNoFuso> | null>(null);
  const uf = restaurante?.uf || paraUF(restaurante?.estado);
  useEffect(() => {
    const atualizar = () => setAgora(agoraNoFuso(uf));
    atualizar();
    const t = setInterval(atualizar, 60000);
    return () => clearInterval(t);
  }, [uf]);
  const status = useMemo(() => (agora ? statusDaLoja(aparencia, agora) : null), [aparencia, agora]);
  // Antes de montar no celular, não decide (evita piscar "fechado").
  const lojaAberta = !pedidosPausados && (status ? status.aberta : true);
  const avisoFechado = pedidosPausados
    ? "Pedidos online pausados no momento"
    : status && !status.aberta
      ? status.proximaAbertura
        ? `Fechado agora · abre ${status.proximaAbertura}`
        : "Fechado agora"
      : undefined;

  // Mesa (QR Code da mesa abre o cardápio com ?mesa=5).
  const [mesa, setMesa] = useState("");
  useEffect(() => {
    if (!slug) return;
    try {
      const daUrl = new URLSearchParams(window.location.search).get("mesa");
      const chave = `mesa-${slug}`;
      if (daUrl) {
        const limpa = daUrl.replace(/[^0-9A-Za-z-]/g, "").slice(0, 10);
        if (limpa) sessionStorage.setItem(chave, limpa);
      }
      setMesa(sessionStorage.getItem(chave) || "");
    } catch {}
  }, [slug]);

  function sairDaMesa() {
    try {
      sessionStorage.removeItem(`mesa-${slug}`);
    } catch {}
    setMesa("");
  }

  // Sem dados do servidor (raro): busca pela API.
  useEffect(() => {
    if (inicial || !slug) return;
    fetch(`/api/cardapio/${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d) => d?.success && setDados(d.cardapio))
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, [inicial, slug]);

  // Guarda para o carrinho, endereço e pagamento abrirem na hora.
  useEffect(() => {
    if (dados) guardarCardapio(slug, dados);
  }, [slug, dados]);

  useEffect(() => {
    try {
      localStorage.setItem("cardapio-slug", slug);
      if (aparencia) {
        localStorage.setItem("logo-restaurante", aparencia.logo_url || "");
        localStorage.setItem("cor-principal", aparencia.cor_primaria || "#571f5b");
      }
    } catch {}
  }, [slug, aparencia]);

  useEffect(() => {
    document.documentElement.style.setProperty("--primary-color", corPrincipal);
  }, [corPrincipal]);

  // ---------------- cliente e fidelidade ----------------
  const [fidelidade, setFidelidade] = useState<any>(null);
  const [ultimoPedido, setUltimoPedido] = useState<any>(null);

  useEffect(() => {
    if (!restaurante?.id) return;
    let token = "";
    try {
      token = localStorage.getItem(`cliente_token-${slug}`) || localStorage.getItem("cliente_token") || "";
    } catch {}
    fetch(`/api/fidelidade?restauranteId=${encodeURIComponent(restaurante.id)}`, { headers: { "x-cliente-token": token } })
      .then((r) => r.json())
      .then((f) => setFidelidade(f?.programa ? f : null))
      .catch(() => {});
    if (!token) return;
    fetch("/api/cliente/me", { headers: { "x-cliente-token": token } })
      .then((r) => r.json())
      .then((r) => {
        const pedido = (r?.pedidos ?? []).find(
          (p: any) => Array.isArray(p.itens) && p.itens.length && !["recusado", "cancelado"].includes(String(p.status))
        );
        if (r?.success && pedido) setUltimoPedido(pedido);
      })
      .catch(() => {});
  }, [restaurante?.id, slug]);

  // ---------------- carrinho ----------------
  const [cart, setCart] = useState<CartItem[]>([]);
  // Só grava depois de ler o que estava salvo (senão apagava o carrinho ao voltar para o cardápio).
  const [carrinhoLido, setCarrinhoLido] = useState(false);

  useEffect(() => {
    if (!slug || !produtos.length) return;
    // Volta com o que o cliente já tinha escolhido (fica salvo por 24 h).
    setCart(conferirComCardapio(lerCarrinho(slug), produtos));
    setCarrinhoLido(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, dados]);

  useEffect(() => {
    if (carrinhoLido) salvarCarrinho(slug, cart);
  }, [cart, slug, carrinhoLido]);

  const [aviso, setAviso] = useState<string | null>(null);
  const avisoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ultimoAviso = useRef(0);
  function mostrarAviso(texto: string) {
    // Vários itens de uma vez (produto + "Combina com"): um aviso só.
    const junto = Date.now() - ultimoAviso.current < 400;
    ultimoAviso.current = Date.now();
    setAviso(junto ? "Itens adicionados ao carrinho" : texto);
    if (avisoTimer.current) clearTimeout(avisoTimer.current);
    avisoTimer.current = setTimeout(() => setAviso(null), 2200);
  }

  function addToCart(
    produto: ProdutoFormatado,
    observacao?: string,
    adicionaisSelecionados?: Adicional[],
    obrigatoriosSelecionados?: { id?: string; grupo: string; nome: string; preco: number }[],
    quantidade = 1
  ) {
    if (!lojaAberta) return;
    const item: CartItem = {
      ...produto,
      uniqueId: crypto.randomUUID(),
      quantity: quantidade,
      observacao,
      precoBase: Number(produto.preco),
      adicionaisSelecionados: adicionaisSelecionados || [],
      obrigatoriosSelecionados: obrigatoriosSelecionados || [],
      preco: 0,
    };
    item.preco = precoUnitario(item);

    setCart((atual) => {
      // Mesmo produto, sem escolhas e sem observação: só soma a quantidade.
      const igual = atual.find(
        (i) =>
          String(i.id) === String(produto.id) &&
          !i.observacao &&
          !observacao &&
          !(i.adicionaisSelecionados ?? []).length &&
          !(i.obrigatoriosSelecionados ?? []).length &&
          !(adicionaisSelecionados ?? []).length &&
          !(obrigatoriosSelecionados ?? []).length
      );
      if (igual) return atual.map((i) => (i === igual ? { ...i, quantity: Math.min(99, i.quantity + quantidade) } : i));
      return [...atual, item];
    });
    mostrarAviso(quantidade > 1 ? `${quantidade}x ${produto.nome} no carrinho` : `${produto.nome} no carrinho`);
  }

  function pedirDeNovo(pedido: any) {
    if (!lojaAberta) {
      mostrarAviso(avisoFechado || "Restaurante fechado agora");
      return;
    }
    const porId = new Map(produtos.map((p) => [String(p.id), p]));
    const itens: CartItem[] = [];
    let faltou = 0;
    for (const antigo of pedido?.itens ?? []) {
      const p: any = porId.get(String(antigo?.id));
      if (!p) {
        faltou++;
        continue;
      }
      const opcoesValidas = new Set(
        (p.gruposObrigatorios ?? []).flatMap((g: any) => (g.grupo_obrigatorio_opcoes ?? []).map((o: any) => String(o.id)))
      );
      const opcoes = (antigo.obrigatoriosSelecionados ?? []).filter((o: any) => opcoesValidas.has(String(o.id)));
      if (opcoes.length !== (antigo.obrigatoriosSelecionados ?? []).length) {
        faltou++;
        continue;
      }
      const adicionaisValidos = new Map((p.adicionais ?? []).map((a: any) => [String(a.id ?? a.nome), a]));
      const adicionais = (antigo.adicionaisSelecionados ?? [])
        .map((a: any) => adicionaisValidos.get(String(a.id ?? a.nome)) ?? adicionaisValidos.get(String(a.nome)))
        .filter(Boolean);
      const item: CartItem = {
        ...p,
        uniqueId: crypto.randomUUID(),
        quantity: Math.max(1, Math.min(99, Number(antigo.quantity) || 1)),
        observacao: antigo.observacao || "",
        precoBase: Number(p.preco),
        adicionaisSelecionados: adicionais as any,
        obrigatoriosSelecionados: opcoes.map((o: any) => ({ id: o.id, grupo: o.grupo, nome: o.nome, preco: Number(o.preco || 0) })),
        preco: 0,
      };
      item.preco = precoUnitario(item);
      itens.push(item);
    }
    if (!itens.length) {
      mostrarAviso("Os itens desse pedido não estão mais no cardápio");
      return;
    }
    setCart(itens);
    salvarCarrinho(slug, itens);
    if (faltou) mostrarAviso(`${faltou} item(ns) não estão mais disponíveis`);
    router.push(`/${slug}/carrinho`);
  }

  const qtdPorProduto = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of cart) m.set(String(i.id), (m.get(String(i.id)) ?? 0) + i.quantity);
    return m;
  }, [cart]);
  const total = totalCarrinho(cart);
  const qtdItens = quantidadeCarrinho(cart);

  // ---------------- produto aberto ----------------
  const [produtoAberto, setProdutoAberto] = useState<ProdutoFormatado | null>(null);
  const fecharProduto = useCallback(() => setProdutoAberto(null), []);

  function abrirProduto(produto: ProdutoFormatado) {
    setAviso(null);
    setProdutoAberto(produto);
  }

  function adicionarRapido(produto: ProdutoFormatado) {
    if (lojaAberta && semEscolhas(produto)) addToCart(produto);
    else abrirProduto(produto);
  }


  // ---------------- busca ----------------
  const [busca, setBusca] = useState("");
  const [buscaAberta, setBuscaAberta] = useState(false);
  const buscaRef = useRef<HTMLInputElement>(null);
  const termo = semAcento(busca.trim());
  const resultados = useMemo(() => {
    if (!termo) return [];
    const palavras = termo.split(/\s+/);
    return produtos.filter((p) => {
      const texto = semAcento(`${p.nome} ${p.descricao ?? ""} ${p.categoria ?? ""}`);
      return palavras.every((w) => texto.includes(w));
    });
  }, [termo, produtos]);

  function abrirBusca() {
    // Foco no mesmo toque: no iPhone o teclado só abre assim.
    buscaRef.current?.focus({ preventScroll: true });
    setBuscaAberta(true);
    const barra = document.getElementById("barra-categorias");
    if (barra) {
      const y = barra.getBoundingClientRect().top + window.scrollY;
      if (window.scrollY < y) window.scrollTo({ top: y, behavior: "smooth" });
    }
  }

  function fecharBusca() {
    setBusca("");
    setBuscaAberta(false);
  }

  // ---------------- categorias ----------------
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(categorias[0] ?? null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const categoriasComProdutos = useMemo(
    () => categorias.filter((c) => produtos.some((p) => p.categoria === c)),
    [categorias, produtos]
  );

  useEffect(() => {
    if (termo) return;
    const secoes = categoriasComProdutos.map((c) => document.getElementById(idCategoria(c))).filter(Boolean) as HTMLElement[];
    if (!secoes.length) return;
    const visiveis = new Set<Element>();
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) e.isIntersecting ? visiveis.add(e.target) : visiveis.delete(e.target);
        // A mais de cima entre as que estão na faixa de leitura.
        const primeira = secoes.find((s) => visiveis.has(s));
        if (primeira) setCategoriaAtiva(primeira.getAttribute("data-categoria"));
      },
      { rootMargin: "-130px 0px -65% 0px" }
    );
    secoes.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [categoriasComProdutos, termo]);

  // A categoria ativa acompanha a rolagem na barra de cima.
  useEffect(() => {
    const barra = chipsRef.current;
    const chip = categoriaAtiva ? barra?.querySelector<HTMLElement>(`[data-chip="${CSS.escape(categoriaAtiva)}"]`) : null;
    if (barra && chip) barra.scrollTo({ left: chip.offsetLeft - barra.clientWidth / 2 + chip.clientWidth / 2, behavior: "smooth" });
  }, [categoriaAtiva]);

  function irParaCategoria(c: string) {
    setCategoriaAtiva(c);
    const el = document.getElementById(idCategoria(c));
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 118, behavior: "smooth" });
  }

  // ---------------- avaliações ----------------
  const [verAvaliacoes, setVerAvaliacoes] = useState(false);

  // Abre o carrinho já carregado (sem recarregar a página).
  useEffect(() => {
    router.prefetch(`/${slug}/carrinho`);
  }, [router, slug]);

  function irParaCarrinho() {
    if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
      (window as any).fbq("track", "InitiateCheckout", { value: total, currency: "BRL", num_items: qtdItens });
    }
    router.push(`/${slug}/carrinho`);
  }

  if (carregando) return <SplashScreen />;

  const pedidoMinimo = Number(aparencia?.pedido_minimo || 0);
  const banner = aparencia?.banner_url || "";

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {pedidosPausados && (
        <div className="bg-amber-500 px-4 py-2 text-center text-sm font-semibold text-white">
          Pedidos online pausados no momento.
          {restaurante?.whatsapp && (
            <>
              {" "}
              <a className="underline" href={`https://wa.me/55${String(restaurante.whatsapp).replace(/\D/g, "").replace(/^55/, "")}`}>
                Peça pelo WhatsApp
              </a>
            </>
          )}
        </div>
      )}

      {mesa && (
        <div className="flex items-center justify-center gap-3 bg-emerald-600 px-4 py-2 text-center text-sm font-semibold text-white">
          🍽️ Pedido na Mesa {mesa}
          <button type="button" onClick={sairDaMesa} className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium">
            Não estou na mesa
          </button>
        </div>
      )}

      {/* ---------- topo ---------- */}
      <section className="mx-auto w-full max-w-5xl">
        <div
          className="relative h-[170px] w-full md:h-[300px] md:rounded-b-3xl md:overflow-hidden"
          style={{
            background: banner
              ? `url(${banner}) center / cover no-repeat`
              : `linear-gradient(135deg, ${corPrincipal} 0%, ${corPrincipal}CC 55%, #111827 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/45" />
          {logo && (
            <div className="pointer-events-none absolute -bottom-10 left-1/2 z-10 -translate-x-1/2">
              <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-white shadow-xl md:h-32 md:w-32">
                <img src={logo} alt={restaurante?.nome_restaurante || "Logo"} className="h-full w-full object-cover" />
              </div>
            </div>
          )}
        </div>

        <div className={`px-4 text-center ${logo ? "pt-12" : "pt-4"}`}>
          <h1 className="text-[22px] font-extrabold leading-tight md:text-3xl">{restaurante?.nome_restaurante}</h1>
          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[13px] text-zinc-500">
            {status && (
              <span className={`font-semibold ${lojaAberta ? "text-emerald-600" : "text-red-600"}`}>
                {pedidosPausados ? "Pedidos pausados" : status.texto}
              </span>
            )}
            {status?.aberta && status.fechaAs && <span>· fecha às {status.fechaAs}</span>}
            {avaliacao?.total >= 3 && (
              <button type="button" onClick={() => setVerAvaliacoes(true)} className="inline-flex items-center gap-1">
                · <Star size={13} className="fill-amber-400 text-amber-400" />
                <strong className="text-zinc-800">
                  {Number(avaliacao.media).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </strong>
                <span className="underline decoration-zinc-300">({avaliacao.total})</span>
              </button>
            )}
          </div>
        </div>

        <div className="mx-4 mt-4 grid grid-cols-2 divide-x divide-zinc-200 rounded-2xl border border-zinc-200 py-3 text-center md:mx-auto md:max-w-xl">
          <div className="px-2">
            <p className="flex items-center justify-center gap-1.5 text-[13px] font-semibold">
              <Bike size={16} className="text-zinc-500" />
              {mesa
                ? "Na mesa"
                : tempos?.tempoEntregaMin && tempos?.tempoEntregaMax
                  ? `${tempos.tempoEntregaMin}–${tempos.tempoEntregaMax} min`
                  : "Delivery"}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {mesa
                ? "sem taxa de entrega"
                : taxaMinima == null
                  ? "taxa no endereço"
                  : taxaMinima > 0
                    ? `entrega a partir de ${reais(taxaMinima)}`
                    : "entrega grátis"}
            </p>
          </div>
          <div className="px-2">
            <p className="flex items-center justify-center gap-1.5 text-[13px] font-semibold">
              <ShoppingBag size={16} className="text-zinc-500" />
              {pedidoMinimo > 0 ? `Mínimo ${reais(pedidoMinimo)}` : "Sem pedido mínimo"}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">Pix, cartão ou dinheiro</p>
          </div>
        </div>

        {/* Fidelidade */}
        {fidelidade?.programa &&
          (() => {
            const necessarios = Number(fidelidade.programa.pedidosNecessarios || 10);
            const selos = Number(fidelidade.cliente?.selos || 0);
            const premio = String(fidelidade.programa.textoPremio || "");
            if (selos >= necessarios) {
              return (
                <div className="mx-4 mt-3 rounded-2xl px-4 py-3 text-center text-white md:mx-auto md:max-w-xl" style={{ backgroundColor: corPrincipal }}>
                  <p className="text-[15px] font-extrabold">🎉 Você ganhou: {premio}</p>
                  <p className="text-[12px] text-white/85">Marque “Usar meu prêmio” na hora de pagar.</p>
                </div>
              );
            }
            return (
              <div className="mx-4 mt-3 rounded-2xl border border-zinc-200 px-3 py-3 md:mx-auto md:max-w-xl">
                <p className="text-center text-[13px] text-zinc-800">
                  Junte <strong>{necessarios} pedidos</strong> e ganhe <strong style={{ color: corPrincipal }}>{premio}</strong>
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-1">
                  {Array.from({ length: necessarios }).map((_, i) => (
                    <Ticket
                      key={i}
                      size={18}
                      strokeWidth={1.8}
                      style={{ color: i < selos ? corPrincipal : "#D6B46A", fill: i < selos ? corPrincipal : "transparent" }}
                    />
                  ))}
                </div>
                {selos > 0 && (
                  <p className="mt-1.5 text-center text-[12px] text-zinc-500">
                    Faltam <strong>{necessarios - selos}</strong> pedidos
                  </p>
                )}
              </div>
            );
          })()}

        {/* Pedir de novo */}
        {ultimoPedido && !termo && (
          <div className="mx-4 mt-3 flex items-center gap-3 rounded-2xl bg-zinc-50 px-4 py-3 md:mx-auto md:max-w-xl">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold">Pedir de novo</p>
              <p className="truncate text-xs text-zinc-500">
                {(ultimoPedido.itens ?? [])
                  .map((i: any) => `${i.quantity}x ${i.nome}`)
                  .join(", ")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => pedirDeNovo(ultimoPedido)}
              className="shrink-0 rounded-xl px-3 py-2 text-[13px] font-bold text-white"
              style={{ backgroundColor: corPrincipal }}
            >
              Repetir
            </button>
          </div>
        )}
      </section>

      {/* ---------- busca + categorias ---------- */}
      <div id="barra-categorias" className="sticky top-0 z-[50] mt-4 border-b border-zinc-100 bg-white/95 backdrop-blur">
        <div className="relative mx-auto flex max-w-5xl items-center gap-2 px-3 py-2.5">
          <div className={buscaAberta || termo ? "flex h-10 flex-1 items-center gap-2 rounded-xl bg-zinc-100 px-3" : "absolute h-0 w-0 overflow-hidden opacity-0"}>
            <Search size={17} className="shrink-0 text-zinc-500" />
            <input
              ref={buscaRef}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onBlur={() => !busca.trim() && setBuscaAberta(false)}
              placeholder="Buscar no cardápio"
              enterKeyHint="search"
              type="search"
              className="h-full min-w-0 flex-1 bg-transparent text-base outline-none [&::-webkit-search-cancel-button]:hidden"
              aria-label="Buscar no cardápio"
              tabIndex={buscaAberta || termo ? 0 : -1}
            />
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={fecharBusca} aria-label="Fechar busca" className="text-zinc-500">
              <X size={18} />
            </button>
          </div>
          {!(buscaAberta || termo) && (
            <>
              <button
                type="button"
                onClick={abrirBusca}
                aria-label="Buscar no cardápio"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600"
              >
                <Search size={18} />
              </button>
              <div ref={chipsRef} className="scrollbar-hide flex flex-1 gap-2 overflow-x-auto scroll-smooth">
                {categoriasComProdutos.map((c) => {
                  const ativa = categoriaAtiva === c;
                  return (
                    <button
                      key={c}
                      data-chip={c}
                      type="button"
                      onClick={() => irParaCategoria(c)}
                      className="h-10 shrink-0 whitespace-nowrap rounded-xl border px-3.5 text-[13px] font-semibold transition-colors"
                      style={{
                        backgroundColor: ativa ? corPrincipal : "#FFFFFF",
                        color: ativa ? "#FFFFFF" : "#3F3F46",
                        borderColor: ativa ? corPrincipal : "#E4E4E7",
                      }}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ---------- produtos ---------- */}
      <section className="mx-auto max-w-5xl pb-6">
        {termo ? (
          <div className="pt-2">
            <p className="px-4 py-2 text-[13px] text-zinc-500">
              {resultados.length
                ? `${resultados.length} resultado${resultados.length > 1 ? "s" : ""} para “${busca.trim()}”`
                : `Nada encontrado para “${busca.trim()}”`}
            </p>
            <div className="md:grid md:grid-cols-2 md:gap-3 md:px-4">
              {resultados.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  corPrincipal={corPrincipal}
                  onAdd={() => abrirProduto(p)}
                  onMais={() => adicionarRapido(p)}
                  noCarrinho={qtdPorProduto.get(String(p.id))}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {(dados?.maisPedidos?.length ?? 0) >= 3 && (
              <div className="pt-5">
                <h2 className="px-4 text-lg font-extrabold">🔥 Mais pedidos</h2>
                <div className="scrollbar-hide mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
                  {(dados.maisPedidos as string[])
                    .map((pid) => produtos.find((p) => String(p.id) === pid))
                    .filter(Boolean)
                    .map((p: any) => (
                      <FeaturedProductCard key={`mais-${p.id}`} product={p} corPrincipal={corPrincipal} onClick={() => abrirProduto(p)} />
                    ))}
                </div>
              </div>
            )}

            {categoriasComProdutos.map((categoria) => {
              const lista = produtos.filter((p) => p.categoria === categoria);
              const faixa = DESTAQUE.test(categoria);
              return (
                <div key={categoria} id={idCategoria(categoria)} data-categoria={categoria} className="scroll-mt-28 pt-5">
                  <h2 className="px-4 text-lg font-extrabold md:text-2xl">{categoria}</h2>
                  {faixa ? (
                    <div className="scrollbar-hide mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
                      {lista.map((p) => (
                        <FeaturedProductCard key={p.id} product={p} corPrincipal={corPrincipal} onClick={() => abrirProduto(p)} />
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 md:mt-3 md:grid md:grid-cols-2 md:gap-3 md:px-4">
                      {lista.map((p) => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          corPrincipal={corPrincipal}
                          onAdd={() => abrirProduto(p)}
                          onMais={() => adicionarRapido(p)}
                          noCarrinho={qtdPorProduto.get(String(p.id))}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {produtos.length === 0 && (
              <p className="px-4 py-16 text-center text-zinc-500">O cardápio ainda está sendo montado. Volte daqui a pouco!</p>
            )}
          </>
        )}
      </section>

      <RestaurantFooter corPrincipal={corPrincipal} />
      <div className={cart.length > 0 ? "h-40" : "h-24"} />

      <ProductModal
        open={Boolean(produtoAberto)}
        onClose={fecharProduto}
        product={produtoAberto}
        onAdd={addToCart}
        corPrincipal={corPrincipal}
        bloqueado={avisoFechado}
      />

      {/* Aviso "adicionado" */}
      {aviso && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[150px] z-[1001] flex justify-center px-4">
          <div className="rounded-full bg-zinc-900/90 px-4 py-2 text-sm font-medium text-white shadow-lg">✓ {aviso}</div>
        </div>
      )}

      {/* Barra do carrinho */}
      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(62px+var(--altura-aviso-cookies,0px)+env(safe-area-inset-bottom))] z-[999] px-3 pb-2">
          <button
            type="button"
            onClick={irParaCarrinho}
            className="mx-auto flex h-14 w-full max-w-xl items-center justify-between rounded-2xl px-4 text-white shadow-xl transition active:scale-[0.99]"
            style={{ backgroundColor: corPrincipal }}
          >
            <span className="flex items-center gap-2.5">
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white/25 px-1.5 text-sm font-bold">{qtdItens}</span>
              <span className="text-[15px] font-bold">Ver carrinho</span>
            </span>
            <span className="text-right leading-tight">
              <span className="block text-[15px] font-bold">{reais(total)}</span>
              {!lojaAberta ? (
                <span className="block text-[11px] text-white/85">{status?.proximaAbertura ? `abre ${status.proximaAbertura}` : "fechado agora"}</span>
              ) : pedidoMinimo > 0 && !mesa && total < pedidoMinimo ? (
                <span className="block text-[11px] text-white/85">faltam {reais(pedidoMinimo - total)} p/ o mínimo</span>
              ) : null}
            </span>
          </button>
        </div>
      )}

      {/* Avaliações */}
      {verAvaliacoes && avaliacao && (
        <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 md:items-center" onClick={() => setVerAvaliacoes(false)}>
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 md:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold">
                <span className="text-amber-500">★</span>{" "}
                {Number(avaliacao.media).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                <span className="ml-2 text-sm font-normal text-zinc-500">{avaliacao.total} avaliações</span>
              </p>
              <button type="button" onClick={() => setVerAvaliacoes(false)} aria-label="Fechar" className="text-2xl leading-none text-zinc-400">
                ×
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {(avaliacao.comentarios ?? []).map((c: any, i: number) => (
                <div key={i} className="rounded-2xl bg-zinc-50 p-3">
                  <p className="text-sm">
                    <span className="text-amber-500">{"★".repeat(c.nota)}</span>
                    <span className="text-zinc-300">{"★".repeat(5 - c.nota)}</span>
                    {c.nome && <span className="ml-2 font-semibold">{c.nome}</span>}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">{c.comentario}</p>
                </div>
              ))}
              {(avaliacao.comentarios ?? []).length === 0 && <p className="text-sm text-zinc-500">Ainda sem comentários escritos.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Aviso de loja fechada (uma vez, ao abrir) */}
      <AvisoFechado
        slug={slug}
        mostrar={Boolean(status && !lojaAberta)}
        pausado={pedidosPausados}
        proximaAbertura={status?.proximaAbertura || ""}
        cor={corPrincipal}
        whatsapp={restaurante?.whatsapp}
      />

      <BottomNavigation
        corPrincipal={corPrincipal}
        onBuscar={abrirBusca}
        onInicio={() => {
          fecharBusca();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onPedirDeNovo={pedirDeNovo}
      />
    </main>
  );
}

/** Mostra uma vez por visita que a loja está fechada, sem impedir de ver o cardápio. */
function AvisoFechado({
  slug,
  mostrar,
  pausado,
  proximaAbertura,
  cor,
  whatsapp,
}: {
  slug: string;
  mostrar: boolean;
  pausado: boolean;
  proximaAbertura: string;
  cor: string;
  whatsapp?: string;
}) {
  const [aberto, setAberto] = useState(false);
  useEffect(() => {
    if (!mostrar) return;
    try {
      const chave = `aviso-fechado-${slug}`;
      if (sessionStorage.getItem(chave)) return;
      sessionStorage.setItem(chave, "1");
    } catch {}
    setAberto(true);
  }, [mostrar, slug]);

  if (!aberto) return null;
  const zap = String(whatsapp || "").replace(/\D/g, "").replace(/^55/, "");
  return (
    <div className="fixed inset-0 z-[1002] flex items-center justify-center bg-black/50 px-5" onClick={() => setAberto(false)}>
      <div className="w-full max-w-[360px] rounded-[28px] bg-white px-6 pb-6 pt-7 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: `${cor}15` }}>
          <Clock3 size={26} style={{ color: cor }} />
        </div>
        <h2 className="text-xl font-bold text-zinc-900">{pausado ? "Pedidos online pausados" : "Estamos fechados agora"}</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          {pausado
            ? "Você pode olhar o cardápio. Para pedir agora, fale com a gente pelo WhatsApp."
            : "Você pode olhar o cardápio à vontade. Os pedidos voltam a ser aceitos quando abrirmos."}
        </p>
        {!pausado && proximaAbertura && (
          <p className="mt-4 rounded-2xl px-4 py-3 text-[15px] font-bold" style={{ backgroundColor: `${cor}10`, color: cor }}>
            Abrimos {proximaAbertura}
          </p>
        )}
        <button type="button" onClick={() => setAberto(false)} className="mt-5 h-12 w-full rounded-xl text-[15px] font-semibold text-white" style={{ backgroundColor: cor }}>
          Ver cardápio
        </button>
        {pausado && zap && (
          <a href={`https://wa.me/55${zap}`} className="mt-2 block text-sm font-semibold text-emerald-700">
            Pedir pelo WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
