"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  CreditCard,
  Gift,
  Download,
  ExternalLink,
  Flame,
  Loader2,
  MessageCircle,
  PackageX,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  TrendingUp,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";
import { FaPix } from "react-icons/fa6";
import { apiFetch } from "@/utils/apiFetch";

type Situacao = "pagante" | "teste" | "inadimplente" | "vencido" | "cancelado";

type Cliente = {
  id: string;
  slug: string;
  nome: string;
  responsavel: string;
  email: string;
  whatsapp: string;
  cidade: string;
  categoria: string;
  cadastro: string;
  situacao: Situacao;
  statusPlano: string | null;
  metodo: "cartao" | "pix" | null;
  acessoAte: string | null;
  diasRestantes: number | null;
  cancelouRenovacao: boolean;
  pagamentos: number;
  pago30: number;
  ultimoPagamento: string | null;
  pedidos30: number;
  vendas30: number;
  pix30: number;
  diasComVenda7: number;
  diasComVenda30: number;
  semana: number[];
  vendeuHoje: boolean;
  ultimoPedido: string | null;
  produtos: number;
  pixOnline: boolean;
  pausado: boolean;
};

type Dados = {
  geradoEm: string;
  preco: number;
  resumo: Record<string, number>;
  semanas: { inicio: string; cadastros: number; pagantes: number }[];
  pedidosPorDia: { dia: string; pedidos: number }[];
  clientes: Cliente[];
};

const COR = "#6D1F2F";
const SITE = "https://meucardapioapp.com";

const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const numero = (v: number) => v.toLocaleString("pt-BR");
const data = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");

function haQuanto(iso: string | null) {
  if (!iso) return "nunca";
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 60) return `há ${Math.max(min, 1)} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ontem" : `há ${d} dias`;
}

const SITUACAO: Record<Situacao, { texto: string; cor: string }> = {
  pagante: { texto: "Assinante", cor: "bg-emerald-100 text-emerald-800" },
  teste: { texto: "Teste grátis", cor: "bg-sky-100 text-sky-800" },
  inadimplente: { texto: "Inadimplente", cor: "bg-amber-100 text-amber-800" },
  vencido: { texto: "Vencido", cor: "bg-red-100 text-red-700" },
  cancelado: { texto: "Cancelado", cor: "bg-zinc-200 text-zinc-700" },
};

type Filtro =
  | "todos"
  | "pagantes"
  | "cartao"
  | "pix"
  | "teste"
  | "testeAcabando"
  | "inadimplentes"
  | "vencidos"
  | "todoDia"
  | "hoje"
  | "semVenda"
  | "semProdutos"
  | "novos"
  | "pagou30"
  | "comPix"
  | "comVendas";

const FILTROS: Record<Filtro, { rotulo: string; teste: (c: Cliente) => boolean }> = {
  todos: { rotulo: "Todos", teste: () => true },
  pagantes: { rotulo: "Assinantes", teste: (c) => c.situacao === "pagante" },
  cartao: { rotulo: "Cartão", teste: (c) => c.situacao === "pagante" && c.metodo === "cartao" },
  pix: { rotulo: "Pix", teste: (c) => c.situacao === "pagante" && c.metodo === "pix" },
  teste: { rotulo: "Teste grátis", teste: (c) => c.situacao === "teste" },
  testeAcabando: { rotulo: "Teste acabando", teste: (c) => c.situacao === "teste" && (c.diasRestantes ?? 99) <= 3 },
  inadimplentes: { rotulo: "Inadimplentes", teste: (c) => c.situacao === "inadimplente" },
  vencidos: { rotulo: "Desativados", teste: (c) => c.situacao === "vencido" || c.situacao === "cancelado" },
  todoDia: { rotulo: "Vendem todo dia", teste: (c) => c.diasComVenda7 >= 6 },
  hoje: { rotulo: "Venderam hoje", teste: (c) => c.vendeuHoje },
  semVenda: {
    rotulo: "Sem vendas há 7 dias",
    teste: (c) => (c.situacao === "pagante" || c.situacao === "teste") && c.diasComVenda7 === 0,
  },
  semProdutos: { rotulo: "Sem produtos", teste: (c) => c.produtos === 0 },
  novos: { rotulo: "Novos (7 dias)", teste: (c) => Date.now() - new Date(c.cadastro).getTime() < 7 * 86400000 },
  pagou30: { rotulo: "Pagaram o plano em 30 dias", teste: (c) => c.pago30 > 0 },
  comPix: { rotulo: "Venderam com Pix online (30 dias)", teste: (c) => c.pix30 > 0 },
  comVendas: { rotulo: "Venderam nos últimos 30 dias", teste: (c) => c.vendas30 > 0 },
};

type Ordem = "cadastro" | "vendas" | "pedidos" | "vencimento" | "nome" | "ultimoPedido";

function zap(c: Cliente, texto?: string) {
  const n = c.whatsapp.replace(/^55/, "");
  if (n.length < 10) return "";
  return `https://wa.me/55${n}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
}

function mensagens(c: Cliente) {
  const nome = (c.responsavel || c.nome).split(" ")[0];
  const lista: { titulo: string; texto: string }[] = [
    { titulo: "Contato", texto: `Oi ${nome}, tudo bem? Aqui é o Victor do MeuCardápioApp.` },
  ];
  if (c.situacao === "teste")
    lista.push({
      titulo: "Teste acabando",
      texto: `Oi ${nome}! Aqui é o Victor do MeuCardápioApp. Seu teste grátis do ${c.nome} termina em ${Math.max(c.diasRestantes ?? 0, 0)} dia(s). Para o cardápio continuar no ar é só assinar em Meu plano no painel. Posso te ajudar com alguma coisa?`,
    });
  if (c.situacao === "inadimplente" || c.situacao === "vencido" || c.situacao === "cancelado")
    lista.push({
      titulo: "Plano vencido",
      texto: `Oi ${nome}! Aqui é o Victor do MeuCardápioApp. Vi que o plano do ${c.nome} venceu e o cardápio saiu do ar. Quer que eu te ajude a reativar? Leva 1 minuto pelo Pix ou cartão em Meu plano.`,
    });
  if (c.produtos === 0)
    lista.push({
      titulo: "Ajuda para montar",
      texto: `Oi ${nome}! Aqui é o Victor do MeuCardápioApp. Vi que o cardápio do ${c.nome} ainda está sem produtos. Quer que eu te ajude a montar? Também dá para importar o cardápio do iFood em Editar Cardápio.`,
    });
  if (c.produtos > 0 && c.diasComVenda7 === 0 && c.situacao !== "vencido")
    lista.push({
      titulo: "Dica para vender",
      texto: `Oi ${nome}! Aqui é o Victor do MeuCardápioApp. Uma dica para o ${c.nome} vender mais: coloque o link ${SITE}/${c.slug} na bio do Instagram e no status do WhatsApp todo dia. Quer ajuda com isso?`,
    });
  return lista;
}

function baixarCsv(lista: Cliente[]) {
  const colunas = [
    ["Restaurante", (c: Cliente) => c.nome],
    ["Responsável", (c: Cliente) => c.responsavel],
    ["WhatsApp", (c: Cliente) => c.whatsapp],
    ["E-mail", (c: Cliente) => c.email],
    ["Cidade", (c: Cliente) => c.cidade],
    ["Cardápio", (c: Cliente) => `${SITE}/${c.slug}`],
    ["Situação", (c: Cliente) => SITUACAO[c.situacao].texto],
    ["Pagamento", (c: Cliente) => c.metodo ?? ""],
    ["Acesso até", (c: Cliente) => data(c.acessoAte)],
    ["Pedidos 30 dias", (c: Cliente) => String(c.pedidos30)],
    ["Vendas 30 dias", (c: Cliente) => c.vendas30.toFixed(2).replace(".", ",")],
    ["Dias com venda (7)", (c: Cliente) => String(c.diasComVenda7)],
    ["Último pedido", (c: Cliente) => data(c.ultimoPedido)],
    ["Produtos", (c: Cliente) => String(c.produtos)],
    ["Cadastro", (c: Cliente) => data(c.cadastro)],
  ] as const;
  const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [colunas.map(([t]) => esc(t)).join(";"), ...lista.map((c) => colunas.map(([, f]) => esc(f(c))).join(";"))].join("\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `clientes-meucardapio-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Barrinhas simples (sem biblioteca). */
function Barras({ valores, rotulos, cor = COR, altura = 64 }: { valores: number[]; rotulos: string[]; cor?: string; altura?: number }) {
  const max = Math.max(1, ...valores);
  return (
    <div className="flex items-end gap-[3px]" style={{ height: altura }}>
      {valores.map((v, i) => (
        <div key={i} className="group relative flex-1">
          <div className="rounded-t-[3px]" style={{ height: Math.max(2, (v / max) * altura), backgroundColor: v ? cor : "#E4E4E7" }} />
          <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] text-white group-hover:block">
            {rotulos[i]}: {v}
          </span>
        </div>
      ))}
    </div>
  );
}

function Cartao({
  titulo,
  valor,
  detalhe,
  Icone,
  filtro,
  ativo,
  onFiltro,
  tom = "neutro",
}: {
  titulo: string;
  valor: string;
  detalhe?: string;
  Icone: any;
  filtro?: Filtro;
  ativo?: boolean;
  onFiltro?: (f: Filtro) => void;
  tom?: "neutro" | "bom" | "alerta" | "ruim";
}) {
  const cores = {
    neutro: "text-zinc-500",
    bom: "text-emerald-600",
    alerta: "text-amber-600",
    ruim: "text-red-600",
  };
  const Tag = filtro ? "button" : "div";
  return (
    <Tag
      {...(filtro ? { type: "button", onClick: () => onFiltro?.(filtro) } : {})}
      className={`rounded-2xl border bg-white p-4 text-left transition ${filtro ? "hover:border-zinc-300 active:scale-[0.99]" : ""} ${
        ativo ? "border-[#6D1F2F] ring-2 ring-[#6D1F2F]/15" : "border-zinc-200"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-zinc-500">{titulo}</p>
        <Icone size={16} className={cores[tom]} />
      </div>
      <p className="mt-1.5 text-2xl font-black tracking-tight text-zinc-900">{valor}</p>
      {detalhe && <p className="mt-0.5 text-xs text-zinc-500">{detalhe}</p>}
    </Tag>
  );
}

export default function PlataformaPage() {
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("cadastro");
  const [abertoId, setAbertoId] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro("");
    try {
      const r = await apiFetch("/api/plataforma/clientes");
      if (r.status === 401) return setErro("Entre com a sua conta para ver o painel.");
      if (r.status === 403) return setErro("Este painel é só do dono da plataforma (OWNER_USER_ID).");
      const d = await r.json();
      if (!d?.success) return setErro(d?.error || "Não foi possível carregar.");
      setDados(d);
    } catch {
      setErro("Sem conexão. Tente de novo.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const lista = useMemo(() => {
    if (!dados) return [];
    const t = busca
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
    const filtrados = dados.clientes.filter((c) => {
      if (!FILTROS[filtro].teste(c)) return false;
      if (!t) return true;
      const alvo = `${c.nome} ${c.responsavel} ${c.email} ${c.whatsapp} ${c.cidade} ${c.slug}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
      return alvo.includes(t);
    });
    const por: Record<Ordem, (a: Cliente, b: Cliente) => number> = {
      cadastro: (a, b) => b.cadastro.localeCompare(a.cadastro),
      vendas: (a, b) => b.vendas30 - a.vendas30,
      pedidos: (a, b) => b.pedidos30 - a.pedidos30,
      vencimento: (a, b) => (a.diasRestantes ?? 9999) - (b.diasRestantes ?? 9999),
      nome: (a, b) => a.nome.localeCompare(b.nome),
      ultimoPedido: (a, b) => String(b.ultimoPedido ?? "").localeCompare(String(a.ultimoPedido ?? "")),
    };
    return [...filtrados].sort(por[ordem]);
  }, [dados, filtro, busca, ordem]);

  if (erro) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
        <div className="max-w-sm rounded-3xl bg-white p-6 text-center shadow-sm">
          <ShieldCheck className="mx-auto" size={32} style={{ color: COR }} />
          <p className="mt-3 font-bold text-zinc-900">{erro}</p>
          <a href="/login" className="mt-4 inline-block rounded-xl px-4 py-2 text-sm font-bold text-white" style={{ backgroundColor: COR }}>
            Ir para o login
          </a>
        </div>
      </main>
    );
  }

  if (!dados) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="animate-spin text-zinc-400" size={32} />
      </main>
    );
  }

  const r = dados.resumo;
  // Sempre a versão mais recente do restaurante aberto (depois de recarregar).
  const aberto = abertoId ? dados.clientes.find((c) => c.id === abertoId) ?? null : null;
  const f = (x: Filtro) => ({
    filtro: x,
    ativo: filtro === x,
    onFiltro: (y: Filtro) => {
      const novo = filtro === y ? "todos" : y;
      setFiltro(novo);
      if (novo === "comVendas" || novo === "comPix") setOrdem("vendas");
      if (novo !== "todos") setTimeout(() => document.getElementById("lista-clientes")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    },
  });

  return (
    <main className="min-h-screen bg-zinc-50 pb-16 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <img src="/apple-touch-icon.png" alt="" className="h-9 w-9 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="font-black leading-tight">Painel da plataforma</p>
            <p className="text-xs text-zinc-500">Atualizado {haQuanto(dados.geradoEm)}</p>
          </div>
          <a href="/seguranca" className="hidden rounded-xl border px-3 py-2 text-sm font-semibold text-zinc-700 sm:inline-flex sm:items-center sm:gap-1.5">
            <ShieldCheck size={16} /> Segurança
          </a>
          <button
            type="button"
            onClick={carregar}
            disabled={carregando}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-white disabled:opacity-60"
            style={{ backgroundColor: COR }}
          >
            <RefreshCw size={16} className={carregando ? "animate-spin" : ""} /> Atualizar
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 pt-5">
        {/* Receita */}
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Receita</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Cartao titulo="Receita mensal (MRR)" valor={reais(r.mrr)} detalhe={`${r.pagantes} assinantes × ${reais(dados.preco)} · ver quem`} Icone={TrendingUp} tom="bom" {...f("pagantes")} />
            <Cartao titulo="Recebido em 30 dias" valor={reais(r.receita30)} detalhe="planos pagos · ver quem pagou" Icone={CreditCard} {...f("pagou30")} />
            <Cartao titulo="Sua comissão Pix (30 dias)" valor={reais(r.comissaoPix30)} detalhe={`1% de ${reais(r.volumePix30)} em Pix · ver quem`} Icone={FaPix} tom="bom" {...f("comPix")} />
            <Cartao titulo="Vendido nos cardápios (30 dias)" valor={reais(r.vendasTotais30)} detalhe={`${numero(r.pedidos30)} pedidos · ver quem`} Icone={Store} {...f("comVendas")} />
          </div>
        </section>

        {/* Clientes */}
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Clientes · toque para filtrar a lista</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <Cartao titulo="Cadastrados" valor={numero(r.total)} detalhe={`+${r.novos7} em 7 dias · +${r.novos30} em 30`} Icone={Users} {...f("todos")} />
            <Cartao titulo="Assinantes" valor={numero(r.pagantes)} detalhe={`conversão ${String(r.conversao).replace(".", ",")}%`} Icone={ShieldCheck} tom="bom" {...f("pagantes")} />
            <Cartao titulo="No cartão" valor={numero(r.cartao)} detalhe="renova sozinho" Icone={CreditCard} {...f("cartao")} />
            <Cartao titulo="No Pix" valor={numero(r.pix)} detalhe="paga todo mês" Icone={FaPix} {...f("pix")} />
            <Cartao titulo="Teste grátis" valor={numero(r.teste)} detalhe={`${r.testeAcabando} acabam em até 3 dias`} Icone={CalendarClock} tom={r.testeAcabando ? "alerta" : "neutro"} {...f("teste")} />
            <Cartao titulo="Desativados" valor={numero(r.vencidos)} detalhe={`${r.inadimplentes} inadimplentes`} Icone={AlertTriangle} tom={r.vencidos ? "ruim" : "neutro"} {...f("vencidos")} />
          </div>
        </section>

        {/* Uso */}
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Uso do cardápio</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <Cartao titulo="Vendem todo dia" valor={numero(r.vendemTodoDia)} detalhe="6 ou 7 dias da semana" Icone={Flame} tom="bom" {...f("todoDia")} />
            <Cartao titulo="Venderam hoje" valor={numero(r.vendeuHoje)} detalhe={`${r.ativos7} venderam na semana`} Icone={Zap} {...f("hoje")} />
            <Cartao titulo="Sem vendas há 7 dias" valor={numero(r.semVenda7)} detalhe="ativos que estão parados" Icone={AlertTriangle} tom={r.semVenda7 ? "alerta" : "neutro"} {...f("semVenda")} />
            <Cartao titulo="Sem produtos" valor={numero(r.semProdutos)} detalhe="precisam de ajuda" Icone={PackageX} tom={r.semProdutos ? "alerta" : "neutro"} {...f("semProdutos")} />
            <Cartao titulo="Teste acabando" valor={numero(r.testeAcabando)} detalhe="hora de chamar" Icone={CalendarClock} tom={r.testeAcabando ? "alerta" : "neutro"} {...f("testeAcabando")} />
            <Cartao titulo="Novos (7 dias)" valor={numero(r.novos7)} detalhe={`${r.pixOnline} com Pix online`} Icone={UserPlus} {...f("novos")} />
          </div>
        </section>

        {/* Gráficos */}
        <section className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-sm font-bold">Cadastros por semana</p>
            <p className="text-xs text-zinc-500">Últimas 12 semanas · {dados.semanas.reduce((t, s) => t + s.pagantes, 0)} desses já pagaram</p>
            <div className="mt-4">
              <Barras valores={dados.semanas.map((s) => s.cadastros)} rotulos={dados.semanas.map((s) => `semana de ${s.inicio.slice(8, 10)}/${s.inicio.slice(5, 7)}`)} />
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-sm font-bold">Pedidos por dia em todos os cardápios</p>
            <p className="text-xs text-zinc-500">Últimos 30 dias</p>
            <div className="mt-4">
              <Barras
                valores={dados.pedidosPorDia.map((d) => d.pedidos)}
                rotulos={dados.pedidosPorDia.map((d) => `${d.dia.slice(8, 10)}/${d.dia.slice(5, 7)}`)}
                cor="#059669"
              />
            </div>
          </div>
        </section>

        {/* Lista */}
        <section id="lista-clientes" className="scroll-mt-20 rounded-3xl border border-zinc-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 md:flex-row md:items-center">
            <div className="min-w-0 flex-1">
              <p className="font-bold">
                {FILTROS[filtro].rotulo} <span className="font-normal text-zinc-500">({lista.length})</span>
              </p>
              {filtro !== "todos" && (
                <button type="button" onClick={() => setFiltro("todos")} className="text-xs font-semibold" style={{ color: COR }}>
                  limpar filtro
                </button>
              )}
            </div>
            <div className="flex h-10 items-center gap-2 rounded-xl bg-zinc-100 px-3 md:w-72">
              <Search size={16} className="text-zinc-500" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Nome, WhatsApp, cidade, e-mail..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filtro}
                onChange={(e) => setFiltro(e.target.value as Filtro)}
                className="h-10 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-2 text-sm"
                aria-label="Filtro"
              >
                {(Object.keys(FILTROS) as Filtro[]).map((k) => (
                  <option key={k} value={k}>
                    {FILTROS[k].rotulo}
                  </option>
                ))}
              </select>
              <select
                value={ordem}
                onChange={(e) => setOrdem(e.target.value as Ordem)}
                className="h-10 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-2 text-sm"
                aria-label="Ordenar"
              >
                <option value="cadastro">Mais novos</option>
                <option value="vendas">Mais vendas</option>
                <option value="pedidos">Mais pedidos</option>
                <option value="ultimoPedido">Último pedido</option>
                <option value="vencimento">Vence primeiro</option>
                <option value="nome">Nome (A–Z)</option>
              </select>
              <button
                type="button"
                onClick={() => baixarCsv(lista)}
                className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-zinc-200 px-3 text-sm font-semibold"
                title="Baixar planilha"
              >
                <Download size={16} /> <span className="hidden sm:inline">Planilha</span>
              </button>
            </div>
          </div>

          {/* Tabela (computador) */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Restaurante</th>
                  <th className="px-3 py-3">Plano</th>
                  <th className="px-3 py-3">Últimos 7 dias</th>
                  <th className="px-3 py-3 text-right">Pedidos 30d</th>
                  <th className="px-3 py-3 text-right">Vendas 30d</th>
                  <th className="px-3 py-3">Último pedido</th>
                  <th className="px-3 py-3">Contato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {lista.map((c) => (
                  <tr key={c.id} className="cursor-pointer hover:bg-zinc-50" onClick={() => setAbertoId(c.id)}>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{c.nome}</p>
                      <p className="text-xs text-zinc-500">
                        {c.responsavel || "—"} · {c.cidade || "sem cidade"}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <Plano c={c} />
                    </td>
                    <td className="px-3 py-3">
                      <Semana c={c} />
                    </td>
                    <td className="px-3 py-3 text-right font-semibold">{numero(c.pedidos30)}</td>
                    <td className="px-3 py-3 text-right">{reais(c.vendas30)}</td>
                    <td className="px-3 py-3 text-zinc-600">{haQuanto(c.ultimoPedido)}</td>
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <Contato c={c} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cartões (celular) */}
          <div className="divide-y divide-zinc-100 lg:hidden">
            {lista.map((c) => (
              <div key={c.id} className="p-4" onClick={() => setAbertoId(c.id)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{c.nome}</p>
                    <p className="text-xs text-zinc-500">
                      {c.responsavel || "—"} · {c.cidade || "sem cidade"}
                    </p>
                  </div>
                  <Plano c={c} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <Semana c={c} />
                  <p className="text-right text-xs text-zinc-500">
                    <strong className="text-zinc-900">{reais(c.vendas30)}</strong> · {c.pedidos30} pedidos/30d
                  </p>
                </div>
                <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                  <Contato c={c} />
                </div>
              </div>
            ))}
          </div>

          {lista.length === 0 && <p className="p-10 text-center text-sm text-zinc-500">Nenhum restaurante com esse filtro.</p>}
        </section>

        <p className="text-center text-xs text-zinc-400">
          Assinante = plano pago e dentro do prazo. Desativado = prazo acabou (cardápio fora do ar). Vendas e pedidos contam só Pix pago,
          dinheiro e cartão na entrega (sem recusados e cancelados).
        </p>
      </div>

      {aberto && <Detalhe c={aberto} onFechar={() => setAbertoId(null)} onAtualizar={carregar} />}
    </main>
  );
}

function Plano({ c }: { c: Cliente }) {
  const s = SITUACAO[c.situacao];
  return (
    <div className="flex flex-col items-start gap-1">
      <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold ${s.cor}`}>
        {s.texto}
        {c.situacao === "pagante" && c.metodo ? ` · ${c.metodo === "cartao" ? "cartão" : "Pix"}` : ""}
      </span>
      <span className="whitespace-nowrap text-[11px] text-zinc-500">
        {c.diasRestantes == null
          ? "sem plano"
          : c.diasRestantes > 0
            ? `${c.cancelouRenovacao ? "cancelou · " : ""}vence em ${c.diasRestantes} dia${c.diasRestantes === 1 ? "" : "s"}`
            : `venceu ${data(c.acessoAte)}`}
      </span>
    </div>
  );
}

function Semana({ c }: { c: Cliente }) {
  return (
    <div className="flex items-center gap-1" title={`${c.diasComVenda7} de 7 dias com venda`}>
      {c.semana.map((n, i) => (
        <span key={i} className="h-3.5 w-3.5 rounded-[4px]" style={{ backgroundColor: n === 0 ? "#E4E4E7" : n < 3 ? "#86EFAC" : n < 10 ? "#22C55E" : "#15803D" }} />
      ))}
      {c.pausado && <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] font-bold text-amber-800">pausado</span>}
    </div>
  );
}

function Contato({ c }: { c: Cliente }) {
  const link = zap(c);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white"
        >
          <MessageCircle size={14} /> {c.whatsapp.replace(/^55/, "").replace(/^(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3")}
        </a>
      ) : (
        <span className="text-xs text-zinc-400">sem WhatsApp</span>
      )}
      <a
        href={`${SITE}/${c.slug}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-700"
      >
        <ExternalLink size={13} /> /{c.slug}
      </a>
    </div>
  );
}

function DarDiasTeste({ c, onAtualizar }: { c: Cliente; onAtualizar: () => Promise<void> }) {
  const [enviando, setEnviando] = useState<number | null>(null);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);

  async function dar(dias: number) {
    if (!window.confirm(`Dar mais ${dias} dias de teste grátis para ${c.nome}?`)) return;
    setEnviando(dias);
    setAviso(null);
    try {
      const r = await apiFetch("/api/plataforma/teste", {
        method: "POST",
        body: JSON.stringify({ restauranteId: c.id, dias }),
      });
      const d = await r.json().catch(() => null);
      if (!r.ok || !d?.success) {
        setAviso({ ok: false, texto: d?.error || "Não foi possível dar os dias." });
        return;
      }
      setAviso({ ok: true, texto: `Pronto! Acesso até ${data(d.acessoAte)}.` });
      await onAtualizar();
    } catch {
      setAviso({ ok: false, texto: "Sem conexão. Tente de novo." });
    } finally {
      setEnviando(null);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 p-3">
      <p className="flex items-center gap-1.5 text-sm font-bold">
        <Gift size={16} style={{ color: COR }} /> Dar mais dias de teste grátis
      </p>
      <p className="mt-1 text-xs text-zinc-500">Soma ao prazo atual (ou a partir de hoje, se já venceu) e volta para teste grátis.</p>
      <div className="mt-2 flex gap-2">
        {[7, 15, 30].map((dias) => (
          <button
            key={dias}
            type="button"
            disabled={enviando !== null}
            onClick={() => dar(dias)}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-zinc-200 py-2 text-sm font-bold disabled:opacity-60"
          >
            {enviando === dias ? <Loader2 size={14} className="animate-spin" /> : null}+{dias} dias
          </button>
        ))}
      </div>
      {aviso && <p className={`mt-2 text-xs font-semibold ${aviso.ok ? "text-emerald-700" : "text-red-600"}`}>{aviso.texto}</p>}
    </div>
  );
}

function Detalhe({ c, onFechar, onAtualizar }: { c: Cliente; onFechar: () => void; onAtualizar: () => Promise<void> }) {
  const [copiado, setCopiado] = useState("");
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onFechar]);

  const itens: [string, string][] = [
    ["Responsável", c.responsavel || "—"],
    ["E-mail", c.email || "—"],
    ["Cidade", c.cidade || "—"],
    ["Categoria", c.categoria || "—"],
    ["Cadastro", `${data(c.cadastro)} (${haQuanto(c.cadastro)})`],
    ["Plano", SITUACAO[c.situacao].texto + (c.metodo && c.situacao === "pagante" ? ` · ${c.metodo === "cartao" ? "cartão" : "Pix"}` : "")],
    ["Acesso até", data(c.acessoAte)],
    ["Pagamentos (90 dias)", `${c.pagamentos}${c.ultimoPagamento ? ` · último ${data(c.ultimoPagamento)}` : ""}`],
    ["Produtos ativos", String(c.produtos)],
    ["Pix online", c.pixOnline ? "ativado" : "não ativado"],
    ["Pedidos (30 dias)", `${c.pedidos30} · ${reais(c.vendas30)}`],
    ["Vendido em Pix (30 dias)", `${reais(c.pix30)} · sua parte ${reais(c.pix30 * 0.01)}`],
    ["Dias com venda", `${c.diasComVenda7} de 7 · ${c.diasComVenda30} de 30`],
    ["Último pedido", c.ultimoPedido ? `${new Date(c.ultimoPedido).toLocaleString("pt-BR")} (${haQuanto(c.ultimoPedido)})` : "nunca"],
  ];

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40" onClick={onFechar}>
      <aside className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 border-b border-zinc-100 p-4">
          <div className="min-w-0 flex-1">
            <p className="text-lg font-black leading-tight">{c.nome}</p>
            <div className="mt-1.5">
              <Plano c={c} />
            </div>
          </div>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="rounded-full p-2 hover:bg-zinc-100">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <Contato c={c} />
          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-zinc-500">Últimos 7 dias</p>
            <Semana c={c} />
          </div>

          <dl className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200">
            {itens.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 px-3 py-2.5 text-sm">
                <dt className="text-zinc-500">{k}</dt>
                <dd className="text-right font-medium text-zinc-900">{v}</dd>
              </div>
            ))}
          </dl>

          {c.situacao !== "pagante" && <DarDiasTeste key={c.id} c={c} onAtualizar={onAtualizar} />}

          {zap(c) && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">Mensagens prontas no WhatsApp</p>
              <div className="space-y-2">
                {mensagens(c).map((m) => (
                  <div key={m.titulo} className="rounded-2xl border border-zinc-200 p-3">
                    <p className="text-sm font-bold">{m.titulo}</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-600">{m.texto}</p>
                    <div className="mt-2 flex gap-2">
                      <a
                        href={zap(c, m.texto)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
                      >
                        <MessageCircle size={14} /> Enviar
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(m.texto).catch(() => {});
                          setCopiado(m.titulo);
                          setTimeout(() => setCopiado(""), 1500);
                        }}
                        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold"
                      >
                        {copiado === m.titulo ? "Copiado!" : "Copiar"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <a
            href={`${SITE}/${c.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 py-3 text-sm font-semibold"
          >
            Abrir o cardápio <ArrowUpRight size={16} />
          </a>
        </div>
      </aside>
    </div>
  );
}
