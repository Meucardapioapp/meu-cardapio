"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlarmClock,
  ArrowRight,
  ClipboardList,
  CreditCard,
  ExternalLink,
  Home,
  LayoutGrid,
  Lock,
  Menu,
  MessageCircle,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { tocarAlerta } from "@/lib/alerta-sonoro";
import { apiFetch } from "@/utils/apiFetch";
import WhatsAppFloating from "../components/WhatsAppFloating";
import AlertaPedidos from "./components/AlertaPedidos";
import AceiteTermos from "./components/AceiteTermos";
import StatusLoja from "./components/StatusLoja";
import { DIAS_AVISO_VENCIMENTO, type EstadoAssinatura } from "@/lib/planos";
import { PASSOS_GUIA } from "@/lib/guia";

const SUPORTE_WHATSAPP = "5592992338863";
const LINK_SUPORTE = `https://wa.me/${SUPORTE_WHATSAPP}?text=${encodeURIComponent("Olá! Preciso de ajuda com o MeuCardapioApp.")}`;

type ItemMenu = { nome: string; link: string; destaque?: boolean };

const GRUPOS_MENU: { titulo: string; itens: ItemMenu[] }[] = [
  {
    titulo: "Operação",
    itens: [
      { nome: "Pedidos (delivery)", link: "/admin/pedidos" },
      { nome: "Início", link: "/admin" },
      { nome: "Relatórios", link: "/admin/relatorios" },
      { nome: "Clientes", link: "/admin/clientes" },
      { nome: "Saques", link: "/admin/saques" },
    ],
  },
  {
    titulo: "Restaurante (salão)",
    itens: [
      { nome: "Mesas e comandas", link: "/admin/salao" },
      { nome: "Equipe", link: "/admin/salao/equipe" },
      { nome: "Relatório da equipe", link: "/admin/salao/relatorio" },
    ],
  },
  {
    titulo: "Cardápio",
    itens: [
      { nome: "Editar Cardápio", link: "/admin/aparencia" },
      { nome: "Editar Produtos", link: "/admin/produtos" },
      { nome: "Categorias", link: "/admin/categorias" },
      { nome: "Horários", link: "/admin/horarios" },
      { nome: "Link do cardápio", link: "/admin/link-cardapio" },
    ],
  },
  {
    titulo: "Vender mais",
    itens: [
      { nome: "Programa de fidelidade", link: "/admin/fidelidade" },
      { nome: "Cupons de desconto", link: "/admin/cupons" },
      { nome: "Avaliações", link: "/admin/avaliacoes" },
    ],
  },
  {
    titulo: "Configurações",
    itens: [
      { nome: "Taxa de entrega", link: "/admin/entrega" },
      { nome: "Endereço para retirada", link: "/admin/restaurante" },
      { nome: "Formas de pagamento", link: "/admin/pagamentos" },
      { nome: "Dados bancários (Pix online)", link: "/admin/dados-bancarios" },
      { nome: "Pixel do Meta", link: "/admin/integracoes" },
    ],
  },
  {
    titulo: "Minha conta",
    itens: [
      { nome: "Meu plano", link: "/admin/plano", destaque: true },
      { nome: "Minha conta", link: "/admin/configuracoes" },
      { nome: "Acessos ao painel", link: "/admin/equipe" },
      { nome: "Notificações", link: "/admin/notificacoes" },
    ],
  },
];

const ABAS_CELULAR = [
  { nome: "Início", link: "/admin", icone: Home },
  { nome: "Pedidos", link: "/admin/pedidos", icone: ClipboardList },
  { nome: "Produtos", link: "/admin/produtos", icone: UtensilsCrossed },
  { nome: "Plano", link: "/admin/plano", icone: CreditCard },
];

/** Telas que o atendente da equipe (login do painel) pode abrir. */
const telaDoAtendente = (pathname: string) =>
  pathname.startsWith("/admin/pedidos") || pathname === "/admin/salao" || pathname === "/admin/notificacoes";

/** Telas que continuam abertas com o plano vencido. */
const LIBERADAS_SEM_PLANO = ["/admin/plano", "/admin/configuracoes"];

function tituloDaPagina(pathname: string) {
  for (const grupo of GRUPOS_MENU) {
    const item = grupo.itens.find((i) => i.link === pathname);
    if (item) return item.nome;
  }
  if (pathname.startsWith("/admin/produtos")) return "Editar Produtos";
  return "Painel";
}

// ---------------------------------------------------------------------
// Contagem regressiva do teste grátis / plano
// ---------------------------------------------------------------------

function useTempoRestante(acessoAte: string | undefined) {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  if (!acessoAte) return null;

  const ms = Math.max(0, new Date(acessoAte).getTime() - agora);
  const dias = Math.floor(ms / 86400000);
  const horas = Math.floor((ms % 86400000) / 3600000);
  const minutos = Math.floor((ms % 3600000) / 60000);

  let texto: string;
  if (dias > 0) texto = `${dias} ${dias === 1 ? "dia" : "dias"} e ${horas}h`;
  else if (horas > 0) texto = `${horas}h ${minutos}min`;
  else texto = `${minutos} min`;

  return { ms, dias, texto };
}

/** Situações em que o acesso termina sozinho se ninguém pagar. */
function venceSozinho(a: EstadoAssinatura) {
  return a.ativo && (a.status === "trial" || a.status === "cancelada" || (a.status === "ativa" && a.metodo === "pix"));
}

function FaixaPlano({ assinatura }: { assinatura: EstadoAssinatura | null }) {
  const tempo = useTempoRestante(assinatura?.acessoAte);

  if (!assinatura || !tempo) return null;

  if (!assinatura.ativo) {
    return (
      <Link href="/admin/plano" className="block bg-red-600 text-white text-sm px-4 py-2.5 text-center font-semibold">
        Seu cardápio está fora do ar. <span className="underline">Renove seu plano</span> para voltar a receber pedidos.
      </Link>
    );
  }

  if (assinatura.status === "inadimplente" && assinatura.ativo) {
    return (
      <Link href="/admin/plano" className="block bg-amber-500 text-white text-sm px-4 py-2 text-center font-semibold">
        Não conseguimos cobrar seu cartão. Atualize o pagamento em até {tempo.texto} para seu cardápio não sair do ar.
      </Link>
    );
  }

  if (!venceSozinho(assinatura)) return null;

  const urgente = assinatura.diasRestantes <= DIAS_AVISO_VENCIMENTO;
  const teste = assinatura.status === "trial";

  if (!urgente) {
    // Plano pago (Pix) com folga: não precisa de faixa nenhuma.
    if (assinatura.status === "ativa") return null;

    return (
      <Link href="/admin/plano" className="block bg-[#6D1F2F] text-white text-sm px-4 py-2 text-center">
        {teste
          ? `Teste grátis: faltam ${assinatura.diasRestantes} dias. `
          : `Plano cancelado: seu cardápio fica no ar por mais ${assinatura.diasRestantes} dias. `}
        <span className="underline font-semibold">{teste ? "Ver planos" : "Assinar de novo"}</span>
      </Link>
    );
  }

  return (
    <Link
      href="/admin/plano"
      className="flex items-center justify-center gap-2 bg-red-600 text-white text-sm px-4 py-2.5 text-center font-semibold"
    >
      <AlarmClock size={18} className="shrink-0 animate-pulse" />
      <span>
        {teste ? "Seu teste grátis termina" : "Seu plano vence"} em <strong className="font-black">{tempo.texto}</strong>.
        Depois disso seu cardápio sai do ar até você {teste ? "escolher um plano" : "renovar"}.{" "}
        <span className="underline">{teste ? "Escolher plano" : "Renovar agora"}</span>
      </span>
    </Link>
  );
}

/** Janela que aparece uma vez por dia nos últimos dias do teste/plano. */
function AvisoVencimento({ assinatura }: { assinatura: EstadoAssinatura | null }) {
  const [aberto, setAberto] = useState(false);
  const tempo = useTempoRestante(assinatura?.acessoAte);

  useEffect(() => {
    if (!assinatura || !venceSozinho(assinatura)) return;
    if (assinatura.diasRestantes > DIAS_AVISO_VENCIMENTO) return;

    const chave = `aviso-vencimento-${new Date().toISOString().slice(0, 10)}`;
    try {
      if (localStorage.getItem(chave)) return;
      localStorage.setItem(chave, "1");
    } catch {}
    setAberto(true);
  }, [assinatura]);

  if (!aberto || !assinatura || !tempo) return null;

  const teste = assinatura.status === "trial";

  return (
    <div className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center p-5" onClick={() => setAberto(false)}>
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
          <AlarmClock size={28} />
        </div>
        <p className="mt-4 text-sm font-semibold text-red-600 uppercase tracking-wide">
          {teste ? "Seu teste grátis está acabando" : "Seu plano está vencendo"}
        </p>
        <p className="mt-1 text-4xl font-black text-zinc-900">{tempo.texto}</p>
        <p className="mt-3 text-zinc-600 leading-relaxed">
          Quando esse tempo acabar, seu cardápio fica <strong>temporariamente fora do ar</strong> e o painel
          trava até você {teste ? "escolher um plano" : "renovar"}. Seus produtos e clientes continuam salvos.
        </p>
        <Link
          href="/admin/plano"
          onClick={() => setAberto(false)}
          className="mt-5 flex h-12 items-center justify-center rounded-xl bg-[#6D1F2F] font-bold text-white"
        >
          {teste ? "Escolher meu plano" : "Renovar agora"}
        </Link>
        <button onClick={() => setAberto(false)} className="mt-2 h-11 w-full rounded-xl font-semibold text-zinc-500">
          Lembrar depois
        </button>
      </div>
    </div>
  );
}

/**
 * Aviso único para quem já usava o MeuCardápio antes dos planos:
 * explica a mudança e os 15 dias grátis. Aparece uma vez por aparelho.
 */
function AvisoNovidades({ assinatura, criadoEm }: { assinatura: EstadoAssinatura | null; criadoEm: string }) {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (!assinatura || assinatura.status !== "trial" || !criadoEm) return;
    const antigo = Date.now() - new Date(criadoEm).getTime() > 20 * 86400000;
    if (!antigo) return;
    try {
      if (localStorage.getItem("aviso-novidades-planos")) return;
      localStorage.setItem("aviso-novidades-planos", "1");
    } catch {}
    setAberto(true);
  }, [assinatura, criadoEm]);

  if (!aberto || !assinatura) return null;

  return (
    <div className="fixed inset-0 z-[125] bg-black/50 flex items-center justify-center p-5" onClick={() => setAberto(false)}>
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-bold uppercase tracking-wide text-[#6D1F2F]">Novidade no MeuCardápio</p>
        <h2 className="mt-1 text-2xl font-black text-zinc-900">Seu painel ficou muito mais completo</h2>
        <ul className="mt-4 space-y-2 text-sm text-zinc-700">
          <li>✅ Cupons de desconto e programa de fidelidade em todos os pedidos</li>
          <li>✅ Alerta sonoro, impressão automática e painel feito para o celular</li>
          <li>✅ Editor visual do cardápio e ordem dos produtos</li>
          <li>✅ Sem taxa por pedido</li>
        </ul>
        <p className="mt-4 text-sm text-zinc-700">
          Para manter tudo isso, o MeuCardápio passa a ter plano de <strong>R$ 79,90/mês</strong>. Você ganhou{" "}
          <strong>{assinatura.diasRestantes} dias grátis</strong> para testar. Assinando antes, os dias que sobram são
          somados ao seu plano.
        </p>
        <Link
          href="/admin/plano"
          onClick={() => setAberto(false)}
          className="mt-5 flex h-12 items-center justify-center rounded-xl bg-[#6D1F2F] font-bold text-white"
        >
          Ver planos
        </Link>
        <button onClick={() => setAberto(false)} className="mt-2 h-11 w-full rounded-xl font-semibold text-zinc-500">
          Entendi
        </button>
      </div>
    </div>
  );
}

/** Painel travado: plano vencido ou teste grátis encerrado. */
function TelaBloqueio({ assinatura }: { assinatura: EstadoAssinatura }) {
  const eraTeste = assinatura.plano == null;

  return (
    <div className="max-w-lg mx-auto mt-6 sm:mt-14 rounded-3xl bg-white border p-7 text-center shadow-sm">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-[#6D1F2F]/10 text-[#6D1F2F] flex items-center justify-center">
        <Lock size={30} />
      </div>
      <h1 className="mt-5 text-2xl font-black text-zinc-900">Seu cardápio está fora do ar</h1>
      <p className="mt-1 font-semibold text-[#6D1F2F]">
        {eraTeste ? "Seu teste grátis terminou. Escolha um plano." : "Seu plano venceu. Renove seu plano."}
      </p>
      <p className="mt-3 text-zinc-600 leading-relaxed">
        Seus clientes não conseguem ver o cardápio nem fazer pedidos, e as funções do painel estão travadas.
        Escolha um plano: assim que o pagamento for confirmado, tudo volta ao normal na hora.
        Seus produtos, pedidos e clientes continuam salvos.
      </p>
      <Link
        href="/admin/plano"
        className="mt-6 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#6D1F2F] font-bold text-white"
      >
        {eraTeste ? "Escolher meu plano" : "Reativar meu plano"} <ArrowRight size={18} />
      </Link>
      <a
        href={LINK_SUPORTE}
        target="_blank"
        rel="noreferrer"
        className="mt-3 flex h-11 items-center justify-center gap-2 rounded-xl border font-semibold text-zinc-700"
      >
        <MessageCircle size={16} /> Falar com o suporte
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------
// Guia: o próximo passo pisca até o dono abrir a área
// ---------------------------------------------------------------------

function useGuia(pathname: string, pronto: boolean) {
  const [feitos, setFeitos] = useState<string[] | null>(null);

  useEffect(() => {
    if (!pronto) return;
    apiFetch("/api/painel/guia")
      .then((r) => r.json())
      .then((d) => setFeitos(d?.success ? d.feitos : []))
      .catch(() => setFeitos([]));
  }, [pronto]);

  // Abriu a área do passo: marca como feito.
  useEffect(() => {
    if (!feitos) return;
    const passo = PASSOS_GUIA.find((p) => pathname === p.link || pathname.startsWith(`${p.link}/`));
    if (!passo || feitos.includes(passo.id)) return;

    setFeitos((f) => [...(f ?? []), passo.id]);
    apiFetch("/api/painel/guia", { method: "POST", body: JSON.stringify({ passo: passo.id }) }).catch(() => {});
  }, [pathname, feitos]);

  if (!feitos) return { proximo: null, numero: 0 };

  const indice = PASSOS_GUIA.findIndex((p) => !feitos.includes(p.id));
  return { proximo: indice === -1 ? null : PASSOS_GUIA[indice], numero: indice + 1 };
}

/** Mesas: pedido novo do garçom (ou do QR) e mesa pedindo a conta acendem o menu e tocam. */
function useSalaoNovos(pathname: string, ativo: boolean) {
  const [aviso, setAviso] = useState<"" | "Novo" | "Conta">("");

  useEffect(() => {
    if (!ativo) return;
    let ultimoVisto = "";
    let contaAntes = 0;
    let parar = false;

    async function olhar() {
      if (document.hidden) return;
      try {
        const d = await apiFetch("/api/salao/resumo").then((r) => r.json());
        if (parar || !d?.success || !d.ativo) return;
        let visto = "";
        try { visto = localStorage.getItem("salao_visto") || ""; } catch {}
        const naTela = window.location.pathname === "/admin/salao";
        const novo = Boolean(d.ultimoLancamento && d.ultimoLancamento > visto);
        // Toca só quando chega algo depois da última olhada (a tela de mesas toca sozinha).
        if (!naTela && ((novo && d.ultimoLancamento !== ultimoVisto && ultimoVisto !== "") || d.pediramConta > contaAntes)) {
          tocarAlerta(d.pediramConta > contaAntes ? "conta" : "pedido");
        }
        ultimoVisto = d.ultimoLancamento || "-";
        contaAntes = d.pediramConta;
        setAviso(naTela ? "" : d.pediramConta > 0 ? "Conta" : novo ? "Novo" : "");
      } catch {}
    }

    olhar();
    const t = setInterval(olhar, 10000);
    const visto = () => setAviso("");
    window.addEventListener("salao-visto", visto);
    return () => {
      parar = true;
      clearInterval(t);
      window.removeEventListener("salao-visto", visto);
    };
  }, [ativo]);

  useEffect(() => {
    if (pathname === "/admin/salao") setAviso("");
  }, [pathname]);

  return aviso;
}

function usePedidosNovos(pathname: string) {
  const [piscar, setPiscar] = useState(false);

  useEffect(() => {
    let primeira = true;
    const aoAtualizar = (e: Event) => {
      const qtd = Number((e as CustomEvent).detail || 0);
      if (primeira && qtd > 0) setPiscar(true);
      primeira = false;
    };
    const aoChegar = () => setPiscar(true);

    window.addEventListener("pedidos-pendentes", aoAtualizar);
    window.addEventListener("novo-pedido", aoChegar);
    return () => {
      window.removeEventListener("pedidos-pendentes", aoAtualizar);
      window.removeEventListener("novo-pedido", aoChegar);
    };
  }, []);

  useEffect(() => {
    if (pathname === "/admin/pedidos") setPiscar(false);
  }, [pathname, piscar]);

  return piscar;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [menuAberto, setMenuAberto] = useState(false);
  const [verificandoAuth, setVerificandoAuth] = useState(true);
  const [assinatura, setAssinatura] = useState<EstadoAssinatura | null>(null);
  const [slug, setSlug] = useState("");
  const [criadoEm, setCriadoEm] = useState("");
  // Atendente da equipe: só vê Pedidos (e a pausa da loja).
  const [papel, setPapel] = useState<"dono" | "atendente">(() => {
    try {
      return typeof window !== "undefined" && localStorage.getItem("papel_painel") === "atendente"
        ? "atendente"
        : "dono";
    } catch {
      return "dono";
    }
  });
  const [nomeMembro, setNomeMembro] = useState("");
  const [lojaAtiva, setLojaAtiva] = useState(true);
  const [termosPendentes, setTermosPendentes] = useState(false);
  const atendente = papel === "atendente";

  useEffect(() => {
    async function verificar() {
      // Sessão guardada no aparelho: abre o painel na hora. Cada chamada ao
      // servidor confere o login de verdade (e volta ao login se expirou).
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        localStorage.removeItem("restaurante_id");
        router.replace("/login");
        return;
      }

      setVerificandoAuth(false);
    }

    verificar();
  }, [router]);

  // Dados do restaurante e situação do plano (recarrega ao trocar de tela).
  const carregar = useCallback(() => {
    apiFetch("/api/restaurante")
      .then((r) => r.json())
      .then((dados) => {
        if (!dados?.success) return;
        if (dados.restaurante?.id) {
          localStorage.setItem("restaurante_id", dados.restaurante.id);
        }
        const novoPapel = dados.papel === "atendente" ? "atendente" : "dono";
        try { localStorage.setItem("papel_painel", novoPapel); } catch {}
        setPapel(novoPapel);
        setNomeMembro(dados.nomeMembro || "");
        setLojaAtiva(dados.lojaAtiva !== false);
        setSlug(dados.restaurante?.slug || "");
        setCriadoEm(dados.restaurante?.criado_em || "");
        setAssinatura(dados.assinatura ?? null);
        setTermosPendentes(dados.termosPendentes === true);
      })
      .catch(() => {});
  }, []);

  // Carrega uma vez e atualiza a cada 5 min ou ao voltar para a aba
  // (antes buscava de novo a cada troca de tela, deixando o painel lento).
  useEffect(() => {
    if (verificandoAuth) return;
    carregar();
    const intervalo = setInterval(carregar, 5 * 60 * 1000);
    const aoVoltar = () => document.visibilityState === "visible" && carregar();
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [verificandoAuth, carregar]);

  useEffect(() => {
    window.addEventListener("assinatura-atualizada", carregar);
    return () => window.removeEventListener("assinatura-atualizada", carregar);
  }, [carregar]);

  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  // App do painel na tela inicial (necessário para notificação no iPhone).
  useEffect(() => {
    if (document.querySelector('link[rel="manifest"]')) return;
    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = "/painel.webmanifest";
    document.head.appendChild(link);
    const meta = document.createElement("meta");
    meta.name = "apple-mobile-web-app-capable";
    meta.content = "yes";
    document.head.appendChild(meta);
    const icone = document.createElement("link");
    icone.rel = "apple-touch-icon";
    icone.href = "/icone-painel-192.png";
    document.head.appendChild(icone);
  }, []);

  const bloqueado = Boolean(assinatura && !assinatura.ativo);
  const guia = useGuia(pathname, !verificandoAuth && !bloqueado && !atendente);

  // Atendente que abrir outra tela volta para Pedidos.
  useEffect(() => {
    if (atendente && !telaDoAtendente(pathname)) router.replace("/admin/pedidos");
  }, [atendente, pathname, router]);
  const pedidosPiscando = usePedidosNovos(pathname);
  const salaoAviso = useSalaoNovos(pathname, !verificandoAuth && !bloqueado);

  async function sair() {
    await supabase.auth.signOut();
    localStorage.removeItem("restaurante_id");
    localStorage.removeItem("papel_painel");
    window.location.href = "/login";
  }

  if (verificandoAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f2f4]">
        <div className="w-8 h-8 border-4 border-[#6D1F2F]/30 border-t-[#6D1F2F] rounded-full animate-spin" />
      </div>
    );
  }

  const piscaItem = (link: string) =>
    (link === "/admin/pedidos" && pedidosPiscando) ||
    (link === "/admin/salao" && Boolean(salaoAviso)) ||
    (guia.proximo?.link === link && !bloqueado);

  const telaLiberada = LIBERADAS_SEM_PLANO.some((p) => pathname.startsWith(p));
  const mostrarBloqueio = bloqueado && !telaLiberada;
  const proximoNoMenuCelular = ABAS_CELULAR.some((a) => a.link === guia.proximo?.link);

  const grupos = atendente
    ? [{ titulo: nomeMembro ? `Olá, ${nomeMembro.split(" ")[0]}` : "Atendimento", itens: [{ nome: "Pedidos (delivery)", link: "/admin/pedidos" }, { nome: "Mesas e comandas", link: "/admin/salao" }, { nome: "Notificações", link: "/admin/notificacoes" }] }]
    : GRUPOS_MENU;

  const Menu_ = (
    <nav className="flex flex-col gap-5">
      {grupos.map((grupo) => (
        <div key={grupo.titulo}>
          <p className="px-3 mb-2 text-[11px] uppercase tracking-wider text-white/40 font-semibold">
            {grupo.titulo}
          </p>
          <div className="flex flex-col gap-1">
            {grupo.itens.map((item) => {
              const ativo = pathname === item.link;
              const pisca = !ativo && piscaItem(item.link);
              return (
                <Link
                  key={item.link}
                  href={item.link}
                  className={`px-3 py-2.5 rounded-xl text-[15px] font-medium transition flex items-center gap-2 ${
                    ativo
                      ? "bg-gradient-to-r from-[#7A1F3D] to-[#542129] text-white shadow"
                      : pisca
                      ? "guia-piscar text-amber-200 font-bold"
                      : item.destaque
                      ? "text-amber-300 hover:bg-white/10"
                      : "text-white/85 hover:bg-white/10"
                  }`}
                >
                  <span className="flex-1">{item.nome}</span>
                  {pisca && (
                    <span className="text-[10px] font-black uppercase bg-amber-400 text-zinc-900 rounded-full px-2 py-0.5">
                      {item.link === "/admin/pedidos" ? "Novo" : item.link === "/admin/salao" ? (salaoAviso === "Conta" ? "Conta" : "Novo") : "Agora"}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex flex-col gap-1 -mt-3">
        {slug && (
          <a
            href={`/${slug}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2.5 rounded-xl text-[15px] font-medium text-white/85 hover:bg-white/10 flex items-center gap-2"
          >
            <ExternalLink size={16} /> Ver meu cardápio
          </a>
        )}

        {!atendente && (
          <a
            href={LINK_SUPORTE}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2.5 rounded-xl text-[15px] font-medium text-white/85 hover:bg-white/10 flex items-center gap-2"
          >
            <MessageCircle size={16} /> Suporte no WhatsApp
          </a>
        )}
      </div>

      <button
        onClick={sair}
        className="px-3 py-3 rounded-xl font-semibold text-white bg-white/10 hover:bg-white/20 text-left"
      >
        Sair
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f4f2f4] lg:flex">
      {/* Menu lateral (computador) */}
      <aside className="hidden lg:flex lg:flex-col sticky top-0 h-screen w-72 shrink-0 overflow-y-auto scrollbar-hide bg-[#1F1C21] px-4 py-6">
        <p className="px-3 mb-6 text-2xl font-black text-white">MeuCardápio</p>
        {Menu_}
      </aside>

      {/* Menu em gaveta (celular) */}
      {menuAberto && (
        <div className="lg:hidden fixed inset-0 z-[80]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuAberto(false)} />
          <aside className="absolute left-0 top-0 h-full w-[82%] max-w-xs overflow-y-auto bg-[#1F1C21] px-4 py-5 shadow-2xl">
            <div className="flex items-center justify-between mb-5 px-1">
              <p className="text-2xl font-black text-white">MeuCardápio</p>
              <button
                onClick={() => setMenuAberto(false)}
                aria-label="Fechar menu"
                className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>
            {Menu_}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Barra superior (celular) */}
        <header className="lg:hidden sticky top-0 z-[60] bg-white/95 backdrop-blur border-b h-16 flex items-center px-3 pr-16">
          <button
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
            className="w-11 h-11 rounded-xl bg-[#1F1C21] text-white flex items-center justify-center"
          >
            <Menu size={22} />
          </button>
          <p className="ml-3 font-bold text-lg text-zinc-900 truncate flex-1">{tituloDaPagina(pathname)}</p>
          {!bloqueado && <StatusLoja compacto />}
        </header>

        {/* Barra superior (computador): nome da tela, situação da loja e o sino.
            Fica no fluxo da página: nunca cobre o conteúdo, com qualquer zoom. */}
        <header className="hidden lg:flex sticky top-0 z-[60] h-16 items-center justify-between gap-4 border-b bg-white/95 backdrop-blur pl-10 pr-20">
          <p className="min-w-0 truncate font-bold text-zinc-900">{tituloDaPagina(pathname)}</p>
          {!bloqueado && <StatusLoja />}
        </header>

        {!atendente && <FaixaPlano assinatura={assinatura} />}
        {atendente && !lojaAtiva && (
          <div className="bg-red-600 px-4 py-2.5 text-center text-sm font-semibold text-white">
            O cardápio está fora do ar. Avise o responsável pelo restaurante.
          </div>
        )}

        <main className="painel flex-1 min-w-0 px-4 py-5 pb-28 sm:px-6 lg:px-10 lg:py-8 lg:pb-10 overflow-x-hidden">
          {/* Próximo passo do guia */}
          {guia.proximo && !mostrarBloqueio && pathname !== guia.proximo.link && (
            <Link
              href={guia.proximo.link}
              className="guia-piscar mb-5 flex items-center gap-3 rounded-2xl border border-amber-300 p-4 text-zinc-900"
            >
              <span className="w-10 h-10 shrink-0 rounded-xl bg-amber-400 font-black flex items-center justify-center">
                {guia.numero}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-wide text-amber-800">
                  Próximo passo · {guia.numero} de {PASSOS_GUIA.length}
                </span>
                <span className="block font-bold">{guia.proximo.nome}</span>
                <span className="block text-sm text-zinc-600">{guia.proximo.dica}</span>
              </span>
              <ArrowRight className="shrink-0" size={20} />
            </Link>
          )}

          {atendente && !telaDoAtendente(pathname)
            ? null
            : mostrarBloqueio && assinatura
            ? <TelaBloqueio assinatura={assinatura} />
            : children}
        </main>

        {/* Abas inferiores (celular) */}
        <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white border-t grid grid-cols-5 pb-[env(safe-area-inset-bottom)] ${atendente ? "hidden" : ""}`}>
          {ABAS_CELULAR.map(({ nome, link, icone: Icone }) => {
            const ativo = link === "/admin" ? pathname === "/admin" : pathname.startsWith(link);
            const pisca = !ativo && piscaItem(link);
            return (
              <Link
                key={link}
                href={link}
                className={`relative flex flex-col items-center justify-center h-16 text-[11px] font-semibold ${
                  ativo ? "text-[#6D1F2F]" : pisca ? "guia-piscar text-amber-700" : "text-zinc-500"
                }`}
              >
                <Icone size={22} />
                {nome}
              </Link>
            );
          })}
          <button
            onClick={() => setMenuAberto(true)}
            className={`flex flex-col items-center justify-center h-16 text-[11px] font-semibold ${
              guia.proximo && !proximoNoMenuCelular && !bloqueado ? "guia-piscar text-amber-700" : "text-zinc-500"
            }`}
          >
            <LayoutGrid size={22} />
            Mais
          </button>
        </nav>
      </div>

      <AlertaPedidos />
      {!atendente && termosPendentes && <AceiteTermos onAceito={() => setTermosPendentes(false)} />}
      {!atendente && <AvisoVencimento assinatura={assinatura} />}
      {!atendente && <AvisoNovidades assinatura={assinatura} criadoEm={criadoEm} />}

      <div className="hidden lg:block">
        <WhatsAppFloating />
      </div>
    </div>
  );
}
