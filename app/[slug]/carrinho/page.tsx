"use client";

import { useEffect, useMemo, useState } from "react";
import { buscarCardapio, cardapioGuardado } from "@/lib/cardapio-cliente";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bike, Minus, Plus, Store, Trash2 } from "lucide-react";
import { useRestaurant } from "@/contexts/RestaurantContext";
import ProductModal, { semEscolhas } from "../../components/ProductModal";
import { agoraNoFuso, statusDaLoja } from "@/lib/horario";
import { paraUF } from "@/lib/uf";
import { precoAPartirDe, reais } from "@/lib/dinheiro";
import { formatarTelefone, telefoneValido } from "@/lib/validacoes";
import {
  conferirComCardapio,
  lerCarrinho,
  precoUnitario,
  quantidadeCarrinho,
  salvarCarrinho,
  totalCarrinho,
} from "@/lib/carrinho";

export default function CarrinhoPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { logo, corPrincipal } = useRestaurant();

  const [cart, setCart] = useState<any[]>([]);
  const [dados, setDados] = useState<any>(null);
  const [carregado, setCarregado] = useState(false);
  const [tipo, setTipo] = useState<"entrega" | "retirada">("entrega");
  const [mesa, setMesa] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erros, setErros] = useState<{ nome?: string; telefone?: string; geral?: string }>({});
  const [produtoAberto, setProdutoAberto] = useState<any>(null);

  useEffect(() => {
    setCart(lerCarrinho(slug));
    try {
      const m = sessionStorage.getItem(`mesa-${slug}`) || "";
      setMesa(m);
      const salvo = localStorage.getItem("tipoPedido");
      if (m) setTipo("retirada");
      else if (salvo === "retirada") setTipo("retirada");
      const retirada = JSON.parse(localStorage.getItem("dadosRetirada") || "{}");
      if (retirada?.nome) setNome(retirada.nome);
      if (retirada?.telefone) setTelefone(formatarTelefone(retirada.telefone));
    } catch {}

    const aplicar = (cardapio: any) => {
      setDados(cardapio);
      // Tira do carrinho o que saiu do cardápio e atualiza preços.
      setCart((atual) => {
        const conferido = conferirComCardapio(atual, cardapio.produtos || []);
        salvarCarrinho(slug, conferido);
        return conferido;
      });
    };
    // Abre na hora com o cardápio desta visita e confere de novo por trás.
    const guardado = cardapioGuardado(slug);
    if (guardado) {
      aplicar(guardado);
      setCarregado(true);
    }
    buscarCardapio(slug)
      .then((novo) => novo && aplicar(novo))
      .finally(() => setCarregado(true));

    const token = (() => {
      try {
        return localStorage.getItem(`cliente_token-${slug}`) || "";
      } catch {
        return "";
      }
    })();
    if (token) {
      fetch("/api/cliente/me", { headers: { "x-cliente-token": token } })
        .then((r) => r.json())
        .then((r) => {
          if (!r?.success) return;
          setNome((n) => n || r.cliente?.nome || "");
          setTelefone((t) => t || formatarTelefone(r.cliente?.telefone || ""));
        })
        .catch(() => {});
    }

    router.prefetch(`/${slug}/endereco`);
    router.prefetch(`/${slug}/pagamento`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  function atualizar(lista: any[]) {
    setCart(lista);
    salvarCarrinho(slug, lista);
  }

  function mudarQuantidade(uniqueId: string, delta: number) {
    atualizar(
      cart
        .map((i) => (i.uniqueId === uniqueId ? { ...i, quantity: Math.min(99, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0)
    );
  }

  function adicionar(produto: any, observacao?: string, adicionais?: any[], obrigatorios?: any[], quantidade = 1) {
    const item: any = {
      ...produto,
      uniqueId: crypto.randomUUID(),
      quantity: quantidade,
      observacao,
      precoBase: Number(produto.preco),
      adicionaisSelecionados: adicionais || [],
      obrigatoriosSelecionados: obrigatorios || [],
    };
    item.preco = precoUnitario(item);
    setCart((atual) => {
      const lista = [...atual, item];
      salvarCarrinho(slug, lista);
      return lista;
    });
  }

  const restaurante = dados?.restaurante;
  const aparencia = dados?.aparencia;
  const uf = restaurante?.uf || paraUF(restaurante?.estado);
  const status = aparencia ? statusDaLoja(aparencia, agoraNoFuso(uf)) : null;
  const pausado = dados ? dados.pedidosAtivos === false : false;
  const lojaAberta = !pausado && (status ? status.aberta : true);
  const pedidoMinimo = Number(aparencia?.pedido_minimo || 0);
  const taxaMinima: number | null = dados?.taxaMinima ?? null;

  const subtotal = totalCarrinho(cart);
  const qtd = quantidadeCarrinho(cart);
  const faltaMinimo = !mesa && pedidoMinimo > 0 && subtotal < pedidoMinimo ? pedidoMinimo - subtotal : 0;

  const sugestoes = useMemo(() => {
    const noCarrinho = new Set(cart.map((i) => String(i.id)));
    const produtos: any[] = (dados?.produtos || []).filter((p: any) => !noCarrinho.has(String(p.id)));
    const marcados = produtos.filter((p) => p.sugerirNoCarrinho);
    const porCategoria = produtos.filter((p) => /bebida|refri|suco|sobremesa|doce|drink/i.test(p.categoria || ""));
    return (marcados.length ? marcados : porCategoria).slice(0, 8);
  }, [dados, cart]);

  const enderecoLoja = [
    [restaurante?.endereco, restaurante?.numero].filter(Boolean).join(", "),
    restaurante?.bairro,
    [restaurante?.cidade, restaurante?.estado].filter(Boolean).join(" - "),
  ]
    .filter(Boolean)
    .join(" · ");

  function continuar() {
    if (!lojaAberta) {
      setErros({ geral: pausado ? "O restaurante pausou os pedidos online agora." : status?.texto || "O restaurante está fechado agora." });
      return;
    }
    if (faltaMinimo > 0) {
      setErros({ geral: `Faltam ${reais(faltaMinimo)} para o pedido mínimo de ${reais(pedidoMinimo)}.` });
      return;
    }
    if (tipo === "retirada") {
      const e: typeof erros = {};
      if (nome.trim().length < 2) e.nome = "Digite seu nome";
      if (!telefoneValido(telefone)) e.telefone = "Digite um telefone com DDD";
      if (e.nome || e.telefone) {
        setErros(e);
        document.getElementById(e.nome ? "nome-retirada" : "telefone-retirada")?.focus();
        return;
      }
    }

    try {
      localStorage.setItem("tipoPedido", mesa ? "mesa" : tipo);
      if (tipo === "retirada") {
        localStorage.setItem("dadosRetirada", JSON.stringify({ nome: nome.trim(), telefone }));
      }
    } catch {}
    router.push(tipo === "retirada" ? `/${slug}/pagamento` : `/${slug}/endereco`);
  }

  const camposContato = (
    <>
                    <div>
        <label htmlFor="nome-retirada" className="text-xs font-semibold text-zinc-600">
          Seu nome
        </label>
        <input
          id="nome-retirada"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            setErros((x) => ({ ...x, nome: undefined }));
          }}
          autoComplete="name"
          placeholder="Como chamar você"
          className={`mt-1 h-12 w-full rounded-xl border px-4 text-base outline-none ${erros.nome ? "border-red-400 bg-red-50" : "border-zinc-200"}`}
        />
        {erros.nome && <p className="mt-1 text-xs text-red-600">{erros.nome}</p>}
      </div>
      <div>
        <label htmlFor="telefone-retirada" className="text-xs font-semibold text-zinc-600">
          WhatsApp
        </label>
        <input
          id="telefone-retirada"
          value={telefone}
          onChange={(e) => {
            setTelefone(formatarTelefone(e.target.value));
            setErros((x) => ({ ...x, telefone: undefined }));
          }}
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="(00) 00000-0000"
          className={`mt-1 h-12 w-full rounded-xl border px-4 text-base outline-none ${erros.telefone ? "border-red-400 bg-red-50" : "border-zinc-200"}`}
        />
        {erros.telefone && <p className="mt-1 text-xs text-red-600">{erros.telefone}</p>}
      </div>
    </>
  );

  return (
    <main className="min-h-screen bg-zinc-50 pb-40 text-zinc-900">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-xl items-center gap-3 px-3">
          <button
            type="button"
            onClick={() => router.push(`/${slug}`)}
            aria-label="Voltar ao cardápio"
            className="flex h-10 w-10 items-center justify-center rounded-full active:bg-zinc-100"
          >
            <ArrowLeft size={22} style={{ color: corPrincipal }} />
          </button>
          {logo && <img src={logo} alt="" className="h-8 w-8 rounded-full object-cover" />}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold leading-tight">Seu pedido</p>
            {restaurante?.nome_restaurante && <p className="truncate text-xs text-zinc-500">{restaurante.nome_restaurante}</p>}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-3 pt-3">
        {status && !lojaAberta && (
          <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong>{pausado ? "Pedidos online pausados" : "Restaurante fechado agora"}</strong>
            {!pausado && status.proximaAbertura && <> · abre {status.proximaAbertura}</>}
          </div>
        )}

        {carregado && cart.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center">
            <p className="text-lg font-bold">Seu carrinho está vazio</p>
            <p className="mt-1 text-sm text-zinc-500">Escolha seus produtos no cardápio.</p>
            <button
              type="button"
              onClick={() => router.push(`/${slug}`)}
              className="mt-5 h-12 w-full rounded-xl font-semibold text-white"
              style={{ backgroundColor: corPrincipal }}
            >
              Ver cardápio
            </button>
          </div>
        ) : (
          <>
            {/* Itens */}
            <div className="divide-y divide-zinc-100 overflow-hidden rounded-3xl bg-white">
              {cart.map((item) => {
                const unitario = precoUnitario(item);
                return (
                  <div key={item.uniqueId} className="flex gap-3 p-4">
                    {item.imagem ? (
                      <img src={item.imagem} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <div
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-xl font-black"
                        style={{ backgroundColor: `${corPrincipal}12`, color: `${corPrincipal}66` }}
                      >
                        {String(item.nome || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[15px] font-semibold leading-snug">{item.nome}</p>
                        <p className="shrink-0 text-[15px] font-bold">{reais(unitario * item.quantity)}</p>
                      </div>
                      {(item.obrigatoriosSelecionados ?? []).length > 0 && (
                        <p className="mt-0.5 text-xs leading-4 text-zinc-500">
                          {(item.obrigatoriosSelecionados ?? []).map((o: any) => o.nome).join(" · ")}
                        </p>
                      )}
                      {(item.adicionaisSelecionados ?? []).length > 0 && (
                        <p className="mt-0.5 text-xs leading-4 text-zinc-500">
                          + {(item.adicionaisSelecionados ?? []).map((a: any) => a.nome).join(", ")}
                        </p>
                      )}
                      {item.observacao && <p className="mt-0.5 text-xs italic leading-4 text-zinc-500">“{item.observacao}”</p>}
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-xs text-zinc-400">{item.quantity > 1 ? `${reais(unitario)} cada` : ""}</p>
                        <div className="flex h-9 items-center rounded-xl border border-zinc-200">
                          <button
                            type="button"
                            aria-label={item.quantity === 1 ? "Remover" : "Diminuir"}
                            onClick={() => mudarQuantidade(item.uniqueId, -1)}
                            className="flex h-9 w-9 items-center justify-center"
                            style={{ color: item.quantity === 1 ? "#DC2626" : corPrincipal }}
                          >
                            {item.quantity === 1 ? <Trash2 size={16} /> : <Minus size={16} strokeWidth={2.6} />}
                          </button>
                          <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                          <button
                            type="button"
                            aria-label="Aumentar"
                            onClick={() => mudarQuantidade(item.uniqueId, 1)}
                            className="flex h-9 w-9 items-center justify-center"
                            style={{ color: corPrincipal }}
                          >
                            <Plus size={16} strokeWidth={2.6} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => router.push(`/${slug}`)}
                className="flex w-full items-center justify-center p-4 text-sm font-bold"
                style={{ color: corPrincipal }}
              >
                + Adicionar mais itens
              </button>
            </div>

            {/* Peça também */}
            {sugestoes.length > 0 && (
              <div className="mt-5">
                <p className="px-1 text-[15px] font-bold">Peça também</p>
                <div className="scrollbar-hide -mx-3 mt-2 flex gap-3 overflow-x-auto px-3 pb-1">
                  {sugestoes.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => (semEscolhas(p) && lojaAberta ? adicionar(p) : setProdutoAberto(p))}
                      className="relative w-28 shrink-0 overflow-hidden rounded-2xl bg-white text-left"
                    >
                      {p.imagem ? (
                        <img src={p.imagem} alt="" loading="lazy" className="h-20 w-full object-cover" />
                      ) : (
                        <div className="h-20 w-full" style={{ backgroundColor: `${corPrincipal}12` }} />
                      )}
                      <span
                        className="absolute right-1.5 top-14 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-white shadow"
                        style={{ backgroundColor: corPrincipal }}
                      >
                        <Plus size={14} strokeWidth={3} />
                      </span>
                      <span className="line-clamp-2 block px-2 pt-1.5 text-xs font-semibold leading-4">{p.nome}</span>
                      <span className="block px-2 pb-2 text-xs font-bold" style={{ color: corPrincipal }}>
                        {precoAPartirDe(p).variavel && <span className="font-medium text-zinc-500">a partir de </span>}
                        {reais(precoAPartirDe(p).valor)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Entrega ou retirada */}
            {mesa ? (
              <div className="mt-5 rounded-3xl bg-white p-4">
                <p className="text-[15px] font-bold">🍽️ Pedido na Mesa {mesa}</p>
                <p className="mt-1 text-sm text-zinc-500">O pedido vai direto para a cozinha e chega na sua mesa.</p>
                <div className="mt-4 space-y-3">{camposContato}</div>
              </div>
            ) : (
              <div className="mt-5 rounded-3xl bg-white p-4">
                <p className="text-[15px] font-bold">Como você quer receber?</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    { id: "entrega" as const, titulo: "Entrega", sub: taxaMinima == null ? "no seu endereço" : taxaMinima > 0 ? `a partir de ${reais(taxaMinima)}` : "grátis", Icone: Bike },
                    { id: "retirada" as const, titulo: "Retirar", sub: "sem taxa", Icone: Store },
                  ].map(({ id, titulo, sub, Icone }) => {
                    const ativo = tipo === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setTipo(id);
                          setErros({});
                        }}
                        className="flex items-center gap-2.5 rounded-2xl border-2 p-3 text-left transition"
                        style={{ borderColor: ativo ? corPrincipal : "#E4E4E7", backgroundColor: ativo ? `${corPrincipal}0D` : "white" }}
                      >
                        <Icone size={20} style={{ color: ativo ? corPrincipal : "#71717A" }} />
                        <span>
                          <span className="block text-sm font-bold">{titulo}</span>
                          <span className="block text-xs text-zinc-500">{sub}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {tipo === "retirada" && (
                  <div className="mt-4 space-y-3">
                    {enderecoLoja && (
                      <div className="rounded-2xl bg-zinc-50 p-3 text-sm text-zinc-600">
                        <p className="font-semibold text-zinc-800">📍 Retirar em</p>
                        <p className="mt-0.5">{enderecoLoja}</p>
                      </div>
                    )}
                    {camposContato}
                  </div>
                )}
              </div>
            )}

            {/* Resumo */}
            <div className="mt-5 rounded-3xl bg-white p-4 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span>{reais(subtotal)}</span>
              </div>
              <div className="mt-1.5 flex justify-between text-zinc-600">
                <span>Entrega</span>
                <span>
                  {mesa || tipo === "retirada"
                    ? "Grátis"
                    : taxaMinima == null
                      ? "calculada no endereço"
                      : taxaMinima > 0
                        ? `a partir de ${reais(taxaMinima)}`
                        : "Grátis"}
                </span>
              </div>
              {faltaMinimo > 0 && (
                <div className="mt-3">
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (subtotal / pedidoMinimo) * 100)}%`, backgroundColor: corPrincipal }} />
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-600">
                    Faltam <strong>{reais(faltaMinimo)}</strong> para o pedido mínimo de {reais(pedidoMinimo)}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <div className="mx-auto max-w-xl">
            {erros.geral && (
              <p role="alert" className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {erros.geral}
              </p>
            )}
            <button
              type="button"
              onClick={continuar}
              disabled={!carregado}
              className="flex h-14 w-full items-center justify-between rounded-2xl px-5 text-[15px] font-bold text-white shadow-lg transition active:scale-[0.99] disabled:opacity-60"
              style={{ backgroundColor: lojaAberta && faltaMinimo === 0 ? corPrincipal : "#A1A1AA" }}
            >
              <span>{tipo === "retirada" || mesa ? "Ir para o pagamento" : "Informar endereço"}</span>
              <span>
                {reais(subtotal)} · {qtd} {qtd === 1 ? "item" : "itens"}
              </span>
            </button>
          </div>
        </div>
      )}

      <ProductModal
        open={Boolean(produtoAberto)}
        product={produtoAberto}
        corPrincipal={corPrincipal}
        onClose={() => setProdutoAberto(null)}
        onAdd={adicionar}
        bloqueado={lojaAberta ? undefined : status?.texto || "Fechado agora"}
      />
    </main>
  );
}
