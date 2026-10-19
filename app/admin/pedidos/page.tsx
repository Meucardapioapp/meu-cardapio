"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Bike,
  Check,
  ChefHat,
  Clock3,
  MessageCircle,
  Printer,
  Search,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { apiFetch } from "@/utils/apiFetch";
import ConviteCelular from "../components/ConviteCelular";
import { supabase } from "@/lib/supabase";

type Pedido = {
  id: number;
  numero_pedido: number | null;
  tipo_pedido: string | null;
  mesa?: string | null;
  cliente: string;
  nome?: string;
  telefone: string;
  bairro: string;
  rua: string;
  numero: string;
  complemento: string;
  referencia: string;
  observacoes: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  taxa_entrega: number;
  desconto_fidelidade?: number;
  desconto_cupom?: number;
  cupom_codigo?: string | null;
  premio_fidelidade?: string | null;
  troco_para?: number | null;
  distancia_km?: number | null;
  total: number;
  total_pago: number;
  status: string;
  itens: any[];
  created_at: string;
  restaurante_id: string;
  motoboy_id?: string | null;
  motoboy_nome?: string | null;
  motoboy_enviado_em?: string | null;
  motoboy_saiu_em?: string | null;
};

type Motoboy = { id: string; nome: string; telefone: string; ativo: boolean; resumo: { emRota: number } };

/** Pedido que vai até o cliente (não é retirada nem mesa). */
const ehEntrega = (p: Pedido) => p.tipo_pedido !== "retirada" && !p.mesa;
const podeEnviarMotoboy = (p: Pedido) =>
  ehEntrega(p) && ["pendente", "aceito", "entrega"].includes(statusNormalizado(p.status));

const ABAS = [
  { id: "pendente", nome: "Novos" },
  { id: "aceito", nome: "Em preparo" },
  { id: "entrega", nome: "Saiu / Pronto" },
  { id: "concluido", nome: "Concluídos" },
  { id: "todos", nome: "Todos" },
] as const;

const PAGAMENTO: Record<string, string> = {
  pix: "Pix (pago)",
  cash: "Dinheiro",
  card_delivery: "Cartão na entrega",
  credit_card: "Cartão de crédito",
  pix_chave: "Pix na sua chave",
};

/** Pix na chave do restaurante que o restaurante ainda não confirmou. */
const aguardandoPix = (p: Pedido) => p.payment_method === "pix_chave" && p.payment_status !== "approved";

const nomePagamento = (p: Pedido) =>
  p.payment_method === "pix_chave"
    ? aguardandoPix(p) ? "Pix na sua chave (conferir)" : "Pix na sua chave (recebido)"
    : PAGAMENTO[p.payment_method] ?? p.payment_method;

const km = (v: unknown) => (v != null && Number(v) > 0 ? ` · ${String(Number(v)).replace(".", ",")} km` : "");

const COLUNAS = [
  { id: "pendente", nome: "Novos", cor: "bg-amber-500" },
  { id: "aceito", nome: "Em preparo", cor: "bg-blue-500" },
  { id: "entrega", nome: "Saiu / Pronto", cor: "bg-purple-500" },
  { id: "concluido", nome: "Concluídos", cor: "bg-green-500" },
] as const;

const reais = (v: number) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** "preparo" era usado antes; trata como "aceito". */
const statusNormalizado = (s: string) => (s === "preparo" ? "aceito" : s);

function horaCurta(data: string) {
  const d = new Date(data);
  const hoje = new Date();
  const mesmoDia = d.toDateString() === hoje.toDateString();

  return mesmoDia
    ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function minutosDesde(data: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(data).getTime()) / 60000));
}

function BadgeStatus({ status, retirada }: { status: string; retirada: boolean }) {
  const s = statusNormalizado(status);
  const mapa: Record<string, [string, string]> = {
    pendente: ["Novo", "bg-amber-100 text-amber-800"],
    aceito: ["Em preparo", "bg-blue-100 text-blue-800"],
    entrega: [retirada ? "Pronto p/ retirada" : "Saiu p/ entrega", "bg-purple-100 text-purple-800"],
    concluido: ["Concluído", "bg-green-100 text-green-800"],
    recusado: ["Recusado", "bg-red-100 text-red-700"],
    cancelado: ["Cancelado", "bg-zinc-200 text-zinc-700"],
  };
  const [texto, classe] = mapa[s] ?? [s, "bg-zinc-100 text-zinc-700"];

  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${classe}`}>{texto}</span>;
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [aba, setAba] = useState<(typeof ABAS)[number]["id"]>("pendente");
  const [selecionado, setSelecionado] = useState<Pedido | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [nomeRestaurante, setNomeRestaurante] = useState("");
  const [atendente, setAtendente] = useState(false);
  const [, forcarRelogio] = useState(0);
  // Computador: colunas (kanban) ou lista. Celular: sempre lista.
  const [visao, setVisao] = useState<"colunas" | "lista">("colunas");
  const [motoboys, setMotoboys] = useState<Motoboy[]>([]);
  const [escolherMotoboy, setEscolherMotoboy] = useState<Pedido | null>(null);

  async function carregarMotoboys() {
    try {
      const d = await apiFetch("/api/painel/funcionarios?funcao=motoboy").then((r) => r.json());
      setMotoboys((d?.motoboys ?? []).filter((m: Motoboy) => m.ativo));
    } catch {}
  }

  async function enviarParaMotoboy(pedido: Pedido, motoboy: Motoboy | null) {
    setSalvando(true);
    try {
      const d = await apiFetch("/api/painel/pedidos", {
        method: "PATCH",
        body: JSON.stringify({ id: pedido.id, motoboy: motoboy?.id ?? null }),
      }).then((r) => r.json());
      if (!d?.success) {
        toast.error(d?.error || "Não foi possível enviar.");
        return;
      }
      const mudanca = {
        motoboy_id: d.pedido.motoboy_id,
        motoboy_nome: d.pedido.motoboy_nome,
        motoboy_enviado_em: d.pedido.motoboy_enviado_em,
      };
      setPedidos((lista) => lista.map((p) => (p.id === pedido.id ? { ...p, ...mudanca } : p)));
      setSelecionado((atual) => (atual && atual.id === pedido.id ? { ...atual, ...mudanca } : atual));
      setEscolherMotoboy(null);
      toast.success(motoboy ? `Enviado para ${motoboy.nome}. Chegou no celular dele.` : "Pedido tirado do motoboy.");
      carregarMotoboys();
    } finally {
      setSalvando(false);
    }
  }

  function textoParaMotoboy(p: Pedido) {
    const total = Number(p.total_pago ?? p.total);
    const cobrar =
      p.payment_method === "cash"
        ? `Receber em dinheiro: ${reais(total)}${p.troco_para && Number(p.troco_para) > total ? ` (troco para ${reais(Number(p.troco_para))} → levar ${reais(Number(p.troco_para) - total)})` : ""}`
        : p.payment_method === "card_delivery"
          ? `Levar maquininha: cobrar ${reais(total)}`
          : aguardandoPix(p)
            ? `Pix de ${reais(total)} ainda não confirmado`
            : "Já pago — não cobrar";
    const endereco = `${p.rua}, ${p.numero} - ${p.bairro}`;
    return [
      `🛵 *Pedido #${p.numero_pedido ?? p.id}*${nomeRestaurante ? ` — ${nomeRestaurante}` : ""}`,
      `Cliente: ${p.cliente}`,
      `Telefone: ${p.telefone}`,
      `Endereço: ${endereco}`,
      p.complemento ? `Compl.: ${p.complemento}` : "",
      p.referencia ? `Ref.: ${p.referencia}` : "",
      `💰 ${cobrar}`,
      p.observacoes ? `Obs.: ${p.observacoes}` : "",
      `Mapa: https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(endereco)}`,
      `App de entregas: ${window.location.origin}/entregador`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  function linkWhatsMotoboy(p: Pedido) {
    const m = motoboys.find((x) => x.id === p.motoboy_id);
    return m ? `https://wa.me/55${m.telefone}?text=${encodeURIComponent(textoParaMotoboy(p))}` : null;
  }

  useEffect(() => {
    try {
      if (localStorage.getItem("pedidos_visao") === "lista") setVisao("lista");
    } catch {}
  }, []);

  function trocarVisao(v: "colunas" | "lista") {
    setVisao(v);
    try { localStorage.setItem("pedidos_visao", v); } catch {}
  }

  async function buscarPedidos() {
    try {
      const resposta = await apiFetch("/api/painel/pedidos?limite=500");
      const dados = await resposta.json();

      if (dados.success) {
        setPedidos(dados.pedidos || []);
        setSelecionado((atual) =>
          atual ? (dados.pedidos || []).find((p: Pedido) => p.id === atual.id) ?? atual : atual
        );
      }
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    buscarPedidos();
    carregarMotoboys();

    const restauranteId = localStorage.getItem("restaurante_id");

    try { setAtendente(localStorage.getItem("papel_painel") === "atendente"); } catch {}
    apiFetch("/api/restaurante")
      .then((r) => r.json())
      .then((d) => setNomeRestaurante(d?.restaurante?.nome_restaurante || ""))
      .catch(() => {});

    const canal = supabase
      .channel(`pedidos-${restauranteId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos", filter: `restaurante_id=eq.${restauranteId}` },
        () => buscarPedidos()
      )
      .subscribe();

    // Garantia caso o tempo real não esteja disponível.
    const intervalo = setInterval(buscarPedidos, 15000);
    const relogio = setInterval(() => forcarRelogio((n) => n + 1), 60000);
    window.addEventListener("novo-pedido", buscarPedidos);

    return () => {
      supabase.removeChannel(canal);
      clearInterval(intervalo);
      clearInterval(relogio);
      window.removeEventListener("novo-pedido", buscarPedidos);
    };
  }, []);

  const contagem = useMemo(() => {
    const c: Record<string, number> = { pendente: 0, aceito: 0, entrega: 0, concluido: 0, todos: pedidos.length };
    for (const p of pedidos) {
      const s = statusNormalizado(p.status);
      if (c[s] !== undefined) c[s] += 1;
    }
    return c;
  }, [pedidos]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return pedidos.filter((p) => {
      const statusOk = aba === "todos" || statusNormalizado(p.status) === aba;
      if (!statusOk) return false;
      if (!termo) return true;

      return [p.cliente, p.telefone, p.rua, p.bairro, p.numero_pedido, p.id]
        .join(" ")
        .toLowerCase()
        .includes(termo);
    });
  }, [pedidos, busca, aba]);

  const porBusca = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return pedidos;
    return pedidos.filter((p) =>
      [p.cliente, p.telefone, p.rua, p.bairro, p.numero_pedido, p.id].join(" ").toLowerCase().includes(termo)
    );
  }, [pedidos, busca]);

  async function confirmarPix(pedido: Pedido, recebido: boolean) {
    setSalvando(true);
    try {
      const resposta = await apiFetch("/api/painel/pedidos", {
        method: "PATCH",
        body: JSON.stringify({ id: pedido.id, pagamento: recebido ? "recebido" : "pendente" }),
      });
      if (!resposta.ok) {
        toast.error("Não foi possível atualizar o pagamento.");
        return;
      }
      const payment_status = recebido ? "approved" : "pending";
      setPedidos((lista) => lista.map((p) => (p.id === pedido.id ? { ...p, payment_status } : p)));
      setSelecionado((atual) => (atual && atual.id === pedido.id ? { ...atual, payment_status } : atual));
      if (recebido) toast.success("Pix confirmado.");
    } finally {
      setSalvando(false);
    }
  }

  async function mudarStatus(pedido: Pedido, status: string) {
    setSalvando(true);

    try {
      const resposta = await apiFetch("/api/painel/pedidos", {
        method: "PATCH",
        body: JSON.stringify({ id: pedido.id, status }),
      });

      if (!resposta.ok) {
        toast.error("Não foi possível atualizar o pedido.");
        return;
      }

      setPedidos((lista) => lista.map((p) => (p.id === pedido.id ? { ...p, status } : p)));
      setSelecionado((atual) => (atual && atual.id === pedido.id ? { ...atual, status } : atual));
      window.dispatchEvent(new Event("pedidos-atualizados"));
    } finally {
      setSalvando(false);
    }
  }

  function linkWhatsApp(pedido: Pedido) {
    let telefone = String(pedido.telefone || "").replace(/\D/g, "");
    if (!telefone.startsWith("55")) telefone = `55${telefone}`;

    const numero = pedido.numero_pedido ?? pedido.id;
    const nome = (pedido.nome || pedido.cliente || "").split(" ")[0];
    const s = statusNormalizado(pedido.status);
    const retirada = pedido.tipo_pedido === "retirada";
    const assinatura = nomeRestaurante ? `\n\n${nomeRestaurante}` : "";

    const mensagens: Record<string, string> = {
      aceito: `Olá, ${nome}! 😊 Seu pedido #${numero} foi aceito e já está em preparo.`,
      entrega: retirada
        ? `Olá, ${nome}! ✅ Seu pedido #${numero} está pronto para retirada.`
        : `Olá, ${nome}! 🛵 Seu pedido #${numero} saiu para entrega.`,
      concluido: `Obrigado pelo pedido, ${nome}! ❤️ Esperamos que tenha gostado.`,
      recusado: `Olá, ${nome}. Infelizmente não conseguimos atender o pedido #${numero} agora. Desculpe o transtorno.`,
    };

    const texto = (mensagens[s] ?? `Olá, ${nome}! Sobre o seu pedido #${numero}:`) + assinatura;

    return `https://wa.me/${telefone}?text=${encodeURIComponent(texto)}`;
  }

  async function excluirPedido() {
    if (!selecionado) return;

    setExcluindo(true);

    try {
      const resposta = await apiFetch("/api/pedido/excluir", {
        method: "DELETE",
        body: JSON.stringify({ pedidoId: selecionado.id }),
      });

      if (!resposta.ok) {
        toast.error("Não foi possível excluir o pedido.");
        return;
      }

      setPedidos((lista) => lista.filter((p) => p.id !== selecionado.id));
      setConfirmarExclusao(false);
      setSelecionado(null);
      toast.success("Pedido excluído.");
    } finally {
      setExcluindo(false);
    }
  }

  const proximaAcao = (p: Pedido) => {
    const s = statusNormalizado(p.status);
    const retirada = p.tipo_pedido === "retirada";

    if (s === "pendente") return { status: "aceito", texto: "Aceitar pedido", icone: <Check size={18} /> };
    if (s === "aceito")
      return {
        status: "entrega",
        texto: p.mesa ? "Levar à mesa" : retirada ? "Pronto para retirada" : "Saiu para entrega",
        icone: retirada ? <ShoppingBag size={18} /> : <Bike size={18} />,
      };
    if (s === "entrega") return { status: "concluido", texto: "Concluir pedido", icone: <Check size={18} /> };
    return null;
  };

  function cartao(p: Pedido, compacto = false) {
    const retirada = p.tipo_pedido === "retirada";
    const acao = proximaAcao(p);
    const qtdItens = (p.itens || []).reduce((s: number, i: any) => s + Number(i.quantity || 1), 0);
    const novo = statusNormalizado(p.status) === "pendente";

    return (
      <div
        key={p.id}
        className={`rounded-2xl bg-white border flex flex-col ${compacto ? "p-3 gap-2" : "p-4 gap-3"} ${novo ? "border-amber-300 ring-2 ring-amber-200" : "border-zinc-200"}`}
      >
        <button onClick={() => setSelecionado(p)} className="text-left">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-black text-lg text-zinc-900">
                #{p.numero_pedido ?? p.id}{" "}
                <span className="font-semibold text-zinc-700 text-base">{p.cliente}</span>
              </p>
              <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                <Clock3 size={12} /> {horaCurta(p.created_at)}
                {novo && <span className="text-amber-700 font-semibold"> · há {minutosDesde(p.created_at)} min</span>}
              </p>
            </div>
            {!compacto && <BadgeStatus status={p.status} retirada={retirada} />}
          </div>

          {aguardandoPix(p) && (
            <p className="mt-2 inline-block rounded-lg bg-teal-50 border border-teal-200 px-2 py-1 text-xs font-bold text-teal-800">
              ⏳ Confira o Pix na sua conta
            </p>
          )}

          <p className="mt-2 text-sm text-zinc-600 truncate">
            {p.mesa ? (
              <span className="font-bold text-emerald-700">🍽️ Mesa {p.mesa}</span>
            ) : retirada ? "🛍️ Retirada no local" : `🛵 ${p.rua}, ${p.numero} · ${p.bairro}${km(p.distancia_km)}`}
          </p>

          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-zinc-500">
              {qtdItens} {qtdItens === 1 ? "item" : "itens"} · {nomePagamento(p)}
            </span>
            <span className="font-black text-zinc-900">{reais(p.total_pago ?? p.total)}</span>
          </div>
        </button>

        {podeEnviarMotoboy(p) && (motoboys.length > 0 || p.motoboy_id) && (
          <button
            disabled={salvando}
            onClick={() => setEscolherMotoboy(p)}
            className={`w-full ${compacto ? "h-9 text-xs" : "h-10 text-sm"} rounded-xl border-2 border-dashed font-semibold flex items-center justify-center gap-1.5 ${
              p.motoboy_id ? "border-purple-300 bg-purple-50 text-purple-800" : "border-zinc-300 text-zinc-600"
            }`}
          >
            <Bike size={compacto ? 14 : 16} />
            {p.motoboy_id ? `${p.motoboy_nome}${p.motoboy_saiu_em ? " · a caminho" : " · enviado"}` : "Enviar p/ motoboy"}
          </button>
        )}

        {acao && (
          <div className="flex gap-2">
            {novo && (
              <button
                disabled={salvando}
                onClick={() => mudarStatus(p, "recusado")}
                className={`${compacto ? "h-10" : "h-11"} px-3 rounded-xl border border-red-200 text-red-600 text-sm font-semibold`}
              >
                Recusar
              </button>
            )}
            <button
              disabled={salvando}
              onClick={() => mudarStatus(p, acao.status)}
              className={`flex-1 ${compacto ? "h-10" : "h-11"} rounded-xl bg-[#6D1F2F] text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60`}
            >
              {acao.icone}
              {compacto && statusNormalizado(p.status) === "pendente" ? "Aceitar" : acao.texto}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={visao === "colunas" ? "max-w-6xl lg:max-w-none mx-auto" : "max-w-6xl mx-auto"}>
      {/* Cabeçalho */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">Pedidos do delivery</h1>
          <p className="text-sm text-zinc-500 mt-1">Clique em um pedido para ver os detalhes. Os pedidos das mesas ficam em <a href="/admin/salao" className="font-semibold text-[#6D1F2F] underline">Mesas e comandas</a>.</p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar nome, telefone, nº"
            className="w-full h-11 rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-base outline-none focus:ring-2 focus:ring-[#6D1F2F]/30"
          />
        </div>
      </div>

      <ConviteCelular />

      {/* Computador: escolher entre colunas e lista */}
      <div className="hidden lg:flex justify-end mt-4">
        <div className="inline-flex rounded-xl border bg-white p-1 text-sm font-semibold">
          {(["colunas", "lista"] as const).map((v) => (
            <button
              key={v}
              onClick={() => trocarVisao(v)}
              className={`h-8 px-3 rounded-lg ${visao === v ? "bg-[#6D1F2F] text-white" : "text-zinc-600"}`}
            >
              {v === "colunas" ? "Colunas" : "Lista"}
            </button>
          ))}
        </div>
      </div>

      {visao === "colunas" && (
        <div className="hidden lg:grid grid-cols-4 gap-3 mt-3 items-start">
          {COLUNAS.map((c) => {
            const lista = porBusca.filter((p) => statusNormalizado(p.status) === c.id);
            const visiveis = c.id === "concluido" ? lista.slice(0, 15) : lista;
            return (
              <div key={c.id} className="rounded-2xl bg-zinc-100/80 p-2 min-h-[50vh]">
                <div className="flex items-center gap-2 px-2 py-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${c.cor}`} />
                  <p className="font-bold text-zinc-800">{c.nome}</p>
                  <span className="ml-auto text-xs font-bold bg-white rounded-full px-2 py-0.5">{lista.length}</span>
                </div>
                <div className="space-y-2 max-h-[calc(100vh-15rem)] overflow-y-auto pr-0.5">
                  {loading && <div className="h-28 rounded-2xl bg-white animate-pulse" />}
                  {!loading && lista.length === 0 && (
                    <p className="text-center text-sm text-zinc-400 py-6">
                      {c.id === "pendente" ? "Nenhum pedido novo" : "Vazio"}
                    </p>
                  )}
                  {visiveis.map((p) => cartao(p, true))}
                  {lista.length > visiveis.length && (
                    <button onClick={() => { trocarVisao("lista"); setAba("concluido"); }} className="w-full text-xs font-semibold text-zinc-500 py-2">
                      Ver todos os {lista.length} concluídos
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={visao === "colunas" ? "lg:hidden" : ""}>
      {/* Abas */}
      <div className="mt-4 -mx-4 px-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 w-max">
          {ABAS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className={`h-10 px-4 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                aba === a.id ? "bg-[#6D1F2F] text-white" : "bg-white text-zinc-700 border border-zinc-200"
              }`}
            >
              {a.nome}
              <span
                className={`ml-2 inline-flex min-w-6 justify-center rounded-full px-1.5 text-xs ${
                  aba === a.id ? "bg-white/20" : a.id === "pendente" && contagem.pendente > 0 ? "bg-amber-500 text-white" : "bg-zinc-100"
                }`}
              >
                {contagem[a.id] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {loading &&
          [0, 1, 2].map((i) => <div key={i} className="h-36 rounded-2xl bg-white animate-pulse" />)}

        {!loading && filtrados.length === 0 && (
          <div className="col-span-full rounded-2xl bg-white p-8 text-center text-zinc-500">
            {aba === "pendente" ? "Nenhum pedido novo. Quando chegar, o painel toca um alerta." : "Nenhum pedido aqui."}
          </div>
        )}

        {filtrados.map((p) => cartao(p))}
      </div>
      </div>

      {/* Detalhe (tela cheia no celular, painel lateral no computador) */}
      {selecionado && (
        <div className="fixed inset-0 z-[70] flex justify-end bg-black/40" onClick={() => setSelecionado(null)}>
          <div
            className="h-full w-full sm:max-w-lg bg-[#f7f8fc] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-black text-lg">Pedido #{selecionado.numero_pedido ?? selecionado.id}</p>
                <p className="text-xs text-zinc-500">{new Date(selecionado.created_at).toLocaleString("pt-BR")}</p>
              </div>
              <button
                onClick={() => setSelecionado(null)}
                aria-label="Fechar"
                className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-3 pb-32">
              <div className="flex items-center justify-between">
                <BadgeStatus status={selecionado.status} retirada={selecionado.tipo_pedido === "retirada"} />
                <span className="text-sm text-zinc-500">{nomePagamento(selecionado)}</span>
              </div>

              {selecionado.payment_method === "pix_chave" && (
                <section
                  className={`rounded-2xl border p-4 ${aguardandoPix(selecionado) ? "bg-teal-50 border-teal-200" : "bg-green-50 border-green-200"}`}
                >
                  {aguardandoPix(selecionado) ? (
                    <>
                      <p className="font-bold text-teal-900">Pix na sua chave: confira se caiu</p>
                      <p className="text-sm text-teal-800 mt-1">
                        Veja no app do seu banco se chegou {reais(selecionado.total_pago ?? selecionado.total)} de {selecionado.cliente}.
                      </p>
                      <button
                        disabled={salvando}
                        onClick={() => confirmarPix(selecionado, true)}
                        className="mt-3 w-full h-12 rounded-xl bg-teal-700 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        <Check size={18} /> Pix recebido
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-green-800">✓ Pix recebido</p>
                      <button
                        disabled={salvando}
                        onClick={() => confirmarPix(selecionado, false)}
                        className="text-xs font-semibold text-zinc-500 underline"
                      >
                        Desfazer
                      </button>
                    </div>
                  )}
                </section>
              )}

              <section className="bg-white rounded-2xl border p-4">
                <p className="text-xs uppercase tracking-wider text-zinc-400">Cliente</p>
                <p className="font-bold text-lg mt-1">{selecionado.cliente}</p>
                <a href={`tel:${selecionado.telefone}`} className="text-zinc-600">{selecionado.telefone}</a>
              </section>

              <section className="bg-white rounded-2xl border p-4">
                <p className="text-xs uppercase tracking-wider text-zinc-400">
                  {selecionado.tipo_pedido === "retirada" ? "Modalidade" : "Endereço"}
                </p>
                {selecionado.mesa ? (
                  <p className="font-black mt-1 text-lg text-emerald-700">🍽️ Mesa {selecionado.mesa}</p>
                ) : selecionado.tipo_pedido === "retirada" ? (
                  <p className="font-semibold mt-1 text-blue-700">🛍️ Retirada no local</p>
                ) : (
                  <div className="mt-1">
                    <p className="font-semibold">{selecionado.rua}, {selecionado.numero}</p>
                    {selecionado.complemento && <p className="text-zinc-600 text-sm">Compl.: {selecionado.complemento}</p>}
                    <p className="text-zinc-600 text-sm">{selecionado.bairro}{km(selecionado.distancia_km)}</p>
                    {selecionado.referencia && <p className="text-zinc-600 text-sm">Ref.: {selecionado.referencia}</p>}
                    <a
                      className="inline-block mt-2 text-sm font-semibold text-[#6D1F2F]"
                      target="_blank"
                      rel="noreferrer"
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selecionado.rua}, ${selecionado.numero} - ${selecionado.bairro}`)}`}
                    >
                      Abrir no mapa →
                    </a>
                  </div>
                )}
              </section>

              {ehEntrega(selecionado) && (selecionado.motoboy_id || (podeEnviarMotoboy(selecionado))) && (
                <section className="bg-white rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-wider text-zinc-400">Motoboy</p>
                  {selecionado.motoboy_id ? (
                    <>
                      <p className="font-bold text-lg mt-1">🛵 {selecionado.motoboy_nome}</p>
                      <p className="text-sm text-zinc-500">
                        {selecionado.motoboy_enviado_em && `Enviado às ${horaCurta(selecionado.motoboy_enviado_em)}`}
                        {selecionado.motoboy_saiu_em && ` · saiu às ${horaCurta(selecionado.motoboy_saiu_em)}`}
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {podeEnviarMotoboy(selecionado) && (
                          <button
                            disabled={salvando}
                            onClick={() => setEscolherMotoboy(selecionado)}
                            className="h-11 rounded-xl border font-semibold text-sm"
                          >
                            Trocar motoboy
                          </button>
                        )}
                        {linkWhatsMotoboy(selecionado) && (
                          <a
                            href={linkWhatsMotoboy(selecionado)!}
                            target="_blank"
                            rel="noreferrer"
                            className="h-11 rounded-xl bg-green-600 text-white font-semibold text-sm flex items-center justify-center gap-1.5"
                          >
                            <MessageCircle size={16} /> WhatsApp dele
                          </a>
                        )}
                      </div>
                    </>
                  ) : motoboys.length > 0 ? (
                    <button
                      disabled={salvando}
                      onClick={() => setEscolherMotoboy(selecionado)}
                      className="mt-2 w-full h-12 rounded-xl bg-purple-700 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <Bike size={18} /> Enviar para motoboy
                    </button>
                  ) : (
                    <p className="text-sm text-zinc-500 mt-1">
                      {atendente ? "Nenhum motoboy cadastrado." : <>Cadastre seus motoboys em <a href="/admin/salao/equipe?funcao=motoboy" className="font-semibold text-[#6D1F2F] underline">Equipe</a> para enviar o pedido direto no celular deles.</>}
                    </p>
                  )}
                </section>
              )}

              <section className="bg-white rounded-2xl border p-4">
                <p className="text-xs uppercase tracking-wider text-zinc-400 mb-2">Itens</p>
                <div className="divide-y">
                  {(selecionado.itens || []).map((item: any, i: number) => (
                    <div key={i} className="py-2">
                      <div className="flex justify-between gap-3">
                        <p className="font-semibold">
                          {item.quantity || 1}x {item.nome}
                        </p>
                        <p className="font-semibold whitespace-nowrap">
                          {reais(Number(item.preco) * Number(item.quantity || 1))}
                        </p>
                      </div>
                      {item.obrigatoriosSelecionados?.map((o: any, j: number) => (
                        <p key={`o${j}`} className="text-sm text-zinc-600">• {o.grupo}: {o.nome}</p>
                      ))}
                      {item.adicionaisSelecionados?.map((a: any, j: number) => (
                        <p key={`a${j}`} className="text-sm text-zinc-600">+ {a.nome}</p>
                      ))}
                      {item.observacao && (
                        <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-2 py-1 mt-1">Obs: {item.observacao}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-t mt-2 pt-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>{reais(selecionado.subtotal)}</span></div>
                  {selecionado.tipo_pedido !== "retirada" && (
                    <div className="flex justify-between"><span>Entrega</span><span>{reais(selecionado.taxa_entrega)}</span></div>
                  )}
                  {Number(selecionado.desconto_cupom) > 0 && (
                    <div className="flex justify-between text-green-700"><span>Cupom {selecionado.cupom_codigo}</span><span>- {reais(Number(selecionado.desconto_cupom))}</span></div>
                  )}
                  {Number(selecionado.desconto_fidelidade) > 0 && (
                    <div className="flex justify-between text-green-700"><span>Cliente fiel</span><span>- {reais(Number(selecionado.desconto_fidelidade))}</span></div>
                  )}
                  {selecionado.premio_fidelidade && (
                    <div className="flex justify-between text-green-700 font-bold"><span>🎁 Cliente fiel + {selecionado.premio_fidelidade}</span><span>{reais(0)}</span></div>
                  )}
                  <div className="flex justify-between text-base font-black pt-1"><span>Total</span><span>{reais(selecionado.total_pago ?? selecionado.total)}</span></div>
                  {selecionado.troco_para ? (
                    <p className="mt-2 rounded-lg bg-green-50 px-3 py-2 font-semibold text-green-800">
                      Troco para {reais(Number(selecionado.troco_para))} — levar {reais(Number(selecionado.troco_para) - Number(selecionado.total))}
                    </p>
                  ) : null}
                </div>
              </section>

              {selecionado.observacoes && (
                <section className="bg-white rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-wider text-zinc-400">Observações</p>
                  <p className="mt-1">{selecionado.observacoes}</p>
                </section>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => window.open(`/imprimir/${selecionado.id}`, "_blank")}
                  className="h-12 rounded-xl bg-zinc-900 text-white font-semibold flex items-center justify-center gap-2"
                >
                  <Printer size={18} /> Imprimir
                </button>
                <a
                  href={linkWhatsApp(selecionado)}
                  target="_blank"
                  rel="noreferrer"
                  className="h-12 rounded-xl bg-green-600 text-white font-semibold flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} /> Avisar cliente
                </a>
              </div>

              {!atendente && <button
                onClick={() => setConfirmarExclusao(true)}
                className="w-full h-12 rounded-xl border border-red-200 bg-red-50 text-red-600 font-semibold flex items-center justify-center gap-2"
              >
                <Trash2 size={18} /> Excluir pedido
              </button>}
            </div>

            {/* Ação principal fixa no rodapé */}
            {proximaAcao(selecionado) && (
              <div className="fixed bottom-0 right-0 w-full sm:max-w-lg bg-white border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex gap-2">
                {statusNormalizado(selecionado.status) === "pendente" && (
                  <button
                    disabled={salvando}
                    onClick={() => mudarStatus(selecionado, "recusado")}
                    className="h-14 px-4 rounded-xl border border-red-200 text-red-600 font-semibold"
                  >
                    Recusar
                  </button>
                )}
                <button
                  disabled={salvando}
                  onClick={() => mudarStatus(selecionado, proximaAcao(selecionado)!.status)}
                  className="flex-1 h-14 rounded-xl bg-[#6D1F2F] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {statusNormalizado(selecionado.status) === "aceito" ? <ChefHat size={18} /> : proximaAcao(selecionado)!.icone}
                  {proximaAcao(selecionado)!.texto}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {escolherMotoboy && (
        <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center bg-black/50 sm:p-6" onClick={() => !salvando && setEscolherMotoboy(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-sm max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black">Enviar pedido #{escolherMotoboy.numero_pedido ?? escolherMotoboy.id}</p>
                <p className="text-sm text-zinc-500">{escolherMotoboy.rua}, {escolherMotoboy.numero} · {escolherMotoboy.bairro}</p>
              </div>
              <button onClick={() => setEscolherMotoboy(null)} aria-label="Fechar" className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                <X size={18} />
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {motoboys.length === 0 && <p className="text-sm text-zinc-500">Nenhum motoboy ativo.</p>}
              {motoboys.map((m) => {
                const atual = escolherMotoboy.motoboy_id === m.id;
                return (
                  <button
                    key={m.id}
                    disabled={salvando || atual}
                    onClick={() => enviarParaMotoboy(escolherMotoboy, m)}
                    className={`w-full h-14 rounded-xl border-2 px-4 flex items-center justify-between gap-3 text-left ${atual ? "border-purple-400 bg-purple-50" : "border-zinc-200 active:bg-zinc-50"}`}
                  >
                    <span className="font-bold truncate">🛵 {m.nome}</span>
                    <span className="text-xs font-semibold text-zinc-500 shrink-0">
                      {atual ? "com ele" : m.resumo?.emRota ? `${m.resumo.emRota} em rota` : "livre"}
                    </span>
                  </button>
                );
              })}
              {escolherMotoboy.motoboy_id && (
                <button
                  disabled={salvando}
                  onClick={() => enviarParaMotoboy(escolherMotoboy, null)}
                  className="w-full h-11 rounded-xl text-sm font-semibold text-red-600"
                >
                  Tirar do motoboy
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmarExclusao && selecionado && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6"
          onClick={() => !excluindo && setConfirmarExclusao(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center">
            <h2 className="text-xl font-black text-zinc-900">Excluir pedido #{selecionado.numero_pedido ?? selecionado.id}?</h2>
            <p className="mt-2 text-sm text-zinc-500">Essa ação não pode ser desfeita.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfirmarExclusao(false)}
                disabled={excluindo}
                className="h-12 rounded-xl border border-zinc-200 font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={excluirPedido}
                disabled={excluindo}
                className="h-12 rounded-xl bg-red-600 font-bold text-white disabled:opacity-50"
              >
                {excluindo ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
