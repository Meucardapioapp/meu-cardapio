"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Bell, Check, ChevronDown, Loader2, LogOut, MapPin, Navigation, Phone, Store } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import EntrarEquipe from "@/app/components/equipe/EntrarEquipe";

type Restaurante = { nome: string; whatsapp: string; cidade: string; estado: string };

type Pedido = {
  id: number;
  numero_pedido: number | null;
  restaurante_id: string;
  cliente: string;
  telefone: string;
  rua: string;
  numero: string;
  bairro: string;
  complemento: string | null;
  referencia: string | null;
  observacoes: string | null;
  itens: any[];
  total: number;
  total_pago: number | null;
  taxa_entrega: number;
  troco_para: number | null;
  payment_method: string;
  payment_status: string;
  status: string;
  distancia_km: number | null;
  motoboy_enviado_em: string;
};

type Entregue = { id: number; numero_pedido: number | null; restaurante_id: string; bairro: string; taxa_entrega: number; entregue_em: string };
type Cancelado = { id: number; numero_pedido: number | null; restaurante_id: string; bairro: string };

type Dados = {
  motoboy: { nome: string; telefone: string };
  restaurantes: Record<string, Restaurante>;
  ativos: Pedido[];
  entregues: Entregue[];
  cancelados: Cancelado[];
};

const COR = "#6D1F2F";
const reais = (v: number) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const hora = (d: string) => new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const numeroDo = (p: { numero_pedido: number | null; id: number }) => p.numero_pedido ?? p.id;


function soNumeroBR(tel: string) {
  let d = String(tel || "").replace(/\D/g, "");
  if (d && !d.startsWith("55")) d = `55${d}`;
  return d;
}

/** O que o motoboy precisa cobrar na porta. */
function cobranca(p: Pedido) {
  const total = Number(p.total_pago ?? p.total);
  if (p.payment_method === "cash") {
    const troco = Number(p.troco_para || 0);
    return {
      classe: "bg-amber-50 border-amber-300 text-amber-900",
      titulo: `💵 Receber em dinheiro: ${reais(total)}`,
      sub: troco > total ? `Troco para ${reais(troco)} → levar ${reais(troco - total)} de troco` : "Cliente não pediu troco",
    };
  }
  if (p.payment_method === "card_delivery") {
    return { classe: "bg-blue-50 border-blue-300 text-blue-900", titulo: `💳 Levar a maquininha: cobrar ${reais(total)}`, sub: "" };
  }
  if (p.payment_method === "pix_chave" && p.payment_status !== "approved") {
    return {
      classe: "bg-red-50 border-red-300 text-red-800",
      titulo: `⚠️ Pix de ${reais(total)} ainda não confirmado`,
      sub: "Confirme com o restaurante antes de entregar.",
    };
  }
  return { classe: "bg-green-50 border-green-300 text-green-800", titulo: "✅ Já está pago — não cobrar nada", sub: "" };
}

function hojeLocal(d: string) {
  return new Date(d).toDateString() === new Date().toDateString();
}

/** Bipe curto e vibração quando chega pedido novo. */
let audio: AudioContext | null = null;
function tocarAlerta() {
  try {
    audio ??= new AudioContext();
    if (audio.state === "suspended") audio.resume();
    const ctx = audio;
    [0, 0.25, 0.5].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.3, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.2);
    });
  } catch {}
  try { navigator.vibrate?.([300, 150, 300, 150, 300]); } catch {}
}

export default function AppEntregador() {
  const [estado, setEstado] = useState<"carregando" | "entrar" | "app">("carregando");
  const [dados, setDados] = useState<Dados | null>(null);
  const [aba, setAba] = useState<"entregar" | "entregues">("entregar");
  const [somLiberado, setSomLiberado] = useState(false);
  const [ocultos, setOcultos] = useState<number[]>([]);
  const conhecidos = useRef<Set<number> | null>(null);

  const carregar = useCallback(async () => {
    try {
      const r = await fetch("/api/entregador/pedidos", { cache: "no-store" });
      if (r.status === 401) {
        setEstado("entrar");
        return;
      }
      const d = await r.json();
      if (!d?.success) return;

      // Pedido novo chegou: alerta.
      const ids = new Set<number>(d.ativos.map((p: Pedido) => p.id));
      if (conhecidos.current) {
        const novos = [...ids].filter((id) => !conhecidos.current!.has(id));
        if (novos.length) {
          tocarAlerta();
          toast.success(novos.length === 1 ? "Novo pedido para entregar!" : `${novos.length} novos pedidos para entregar!`);
          try {
            if (document.hidden && "Notification" in window && Notification.permission === "granted") {
              new Notification("Novo pedido para entregar", { body: "Abra para ver o endereço.", tag: "entrega" });
            }
          } catch {}
        }
      }
      conhecidos.current = ids;
      setDados(d);
      setEstado("app");
    } catch {
      // sem internet: tenta de novo no próximo ciclo
    }
  }, []);

  useEffect(() => {
    try { setOcultos(JSON.parse(localStorage.getItem("mb_cancelados_vistos") || "[]")); } catch {}
    carregar();
    const t = setInterval(() => { if (!document.hidden) carregar(); }, 8000);
    const aoVoltar = () => { if (!document.hidden) carregar(); };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", aoVoltar); };
  }, [carregar]);

  function liberarSom() {
    tocarAlerta();
    setSomLiberado(true);
    try {
      if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
    } catch {}
  }

  async function sair() {
    await fetch("/api/equipe-app/sair", { method: "POST" }).catch(() => {});
    conhecidos.current = null;
    setDados(null);
    setEstado("entrar");
  }

  function ocultarCancelado(id: number) {
    const lista = [...ocultos, id].slice(-50);
    setOcultos(lista);
    try { localStorage.setItem("mb_cancelados_vistos", JSON.stringify(lista)); } catch {}
  }

  const entreguesHoje = useMemo(() => (dados?.entregues ?? []).filter((e) => hojeLocal(e.entregue_em)), [dados]);
  const taxasHoje = entreguesHoje.reduce((s, e) => s + Number(e.taxa_entrega || 0), 0);
  const variosRestaurantes = Object.keys(dados?.restaurantes ?? {}).length > 1;

  if (estado === "carregando") {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-50">
        <Loader2 className="animate-spin text-zinc-400" size={32} />
      </div>
    );
  }

  if (estado === "entrar") {
    return <EntrarEquipe titulo="Entregas" emoji="🛵" paginaAtual="/entregador" onEntrou={() => { setSomLiberado(true); carregar(); }} />;
  }

  const cancelados = (dados?.cancelados ?? []).filter((c) => !ocultos.includes(c.id));

  return (
    <div className="min-h-dvh bg-zinc-100 pb-10">
      <header className="sticky top-0 z-20 bg-white border-b">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-black text-lg leading-tight truncate">Olá, {dados?.motoboy.nome.split(" ")[0]} 🛵</p>
            <p className="text-xs text-zinc-500">
              Hoje: {entreguesHoje.length} {entreguesHoje.length === 1 ? "entrega" : "entregas"} · {reais(taxasHoje)} em taxas
            </p>
          </div>
          <button onClick={sair} className="h-10 px-3 rounded-xl border text-sm font-semibold flex items-center gap-1.5 shrink-0">
            <LogOut size={16} /> Sair
          </button>
        </div>
        <div className="max-w-xl mx-auto px-4 pb-3 grid grid-cols-2 gap-2">
          {(["entregar", "entregues"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAba(a)}
              className={`h-11 rounded-xl text-sm font-bold ${aba === a ? "text-white" : "bg-zinc-100 text-zinc-700"}`}
              style={aba === a ? { backgroundColor: COR } : undefined}
            >
              {a === "entregar" ? `Para entregar (${dados?.ativos.length ?? 0})` : `Entregues hoje (${entreguesHoje.length})`}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-4 space-y-3">
        {!somLiberado && (
          <button
            onClick={liberarSom}
            className="w-full rounded-2xl bg-amber-100 border border-amber-300 p-4 text-left flex items-center gap-3"
          >
            <Bell className="text-amber-700 shrink-0" />
            <span className="text-sm font-semibold text-amber-900">
              Toque aqui para ligar o som dos avisos de pedido novo.
            </span>
          </button>
        )}

        {cancelados.map((c) => (
          <div key={c.id} className="rounded-2xl bg-red-600 text-white p-4 flex items-start gap-3">
            <div className="flex-1">
              <p className="font-black">Pedido #{numeroDo(c)} foi CANCELADO</p>
              <p className="text-sm opacity-90">
                {c.bairro ? `${c.bairro} · ` : ""}Não precisa mais entregar. Devolva ao restaurante se já pegou.
              </p>
            </div>
            <button onClick={() => ocultarCancelado(c.id)} className="h-9 px-3 rounded-lg bg-white/20 text-sm font-bold">
              OK
            </button>
          </div>
        ))}

        {aba === "entregar" && (
          <>
            {dados?.ativos.length === 0 && (
              <div className="rounded-2xl bg-white p-10 text-center">
                <p className="text-4xl">🛵</p>
                <p className="mt-3 font-bold">Nenhuma entrega agora</p>
                <p className="text-sm text-zinc-500 mt-1">
                  Deixe esta tela aberta. Quando o restaurante enviar um pedido, ele aparece aqui com um aviso.
                </p>
              </div>
            )}
            {dados?.ativos.map((p) => (
              <CartaoEntrega
                key={p.id}
                p={p}
                restaurante={dados.restaurantes[p.restaurante_id]}
                mostrarRestaurante={variosRestaurantes}
                aoMudar={carregar}
              />
            ))}
          </>
        )}

        {aba === "entregues" && (
          <div className="rounded-2xl bg-white border overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <p className="font-bold">Entregues hoje</p>
              <p className="font-black">{reais(taxasHoje)}</p>
            </div>
            {entreguesHoje.length === 0 && <p className="p-6 text-center text-sm text-zinc-500">Nenhuma entrega concluída hoje.</p>}
            <div className="divide-y">
              {entreguesHoje.map((e) => (
                <div key={e.id} className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-bold">#{numeroDo(e)} · {e.bairro || "—"}</p>
                    <p className="text-zinc-500 text-xs">
                      {hora(e.entregue_em)}
                      {variosRestaurantes ? ` · ${dados?.restaurantes[e.restaurante_id]?.nome ?? ""}` : ""}
                    </p>
                  </div>
                  <p className="font-semibold whitespace-nowrap">{reais(e.taxa_entrega)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-zinc-400 pt-4">
          Dica: adicione esta página à tela inicial do celular para abrir como um app.
        </p>
      </main>
    </div>
  );
}

function CartaoEntrega({
  p,
  restaurante,
  mostrarRestaurante,
  aoMudar,
}: {
  p: Pedido;
  restaurante?: Restaurante;
  mostrarRestaurante: boolean;
  aoMudar: () => Promise<void>;
}) {
  const [enviando, setEnviando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [verItens, setVerItens] = useState(false);
  const saiu = p.status === "entrega";
  const pagamento = cobranca(p);

  const local = [restaurante?.cidade, restaurante?.estado].filter(Boolean).join(" - ");
  const endereco = `${p.rua}, ${p.numero} - ${p.bairro}${local ? `, ${local}` : ""}`;
  const primeiroNome = (p.cliente || "").split(" ")[0];
  const textoCliente = `Olá, ${primeiroNome}! Sou o entregador${restaurante?.nome ? ` do ${restaurante.nome}` : ""}. Estou a caminho com seu pedido #${numeroDo(p)}. 🛵`;
  const qtd = (p.itens || []).reduce((s, i) => s + Number(i.quantity || 1), 0);

  async function acao(tipo: "saiu" | "entregue") {
    setEnviando(true);
    try {
      const r = await fetch("/api/entregador/pedidos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, acao: tipo }),
      });
      const d = await r.json().catch(() => null);
      if (!d?.success) toast.error(d?.error || "Não foi possível salvar. Tente de novo.");
      else toast.success(tipo === "saiu" ? "Boa entrega! 🛵" : "Entrega concluída ✓");
      await aoMudar();
    } finally {
      setEnviando(false);
      setConfirmar(false);
    }
  }

  return (
    <article className={`rounded-2xl bg-white border-2 overflow-hidden ${saiu ? "border-purple-300" : "border-amber-300"}`}>
      <div className={`px-4 py-2 text-xs font-bold flex items-center justify-between ${saiu ? "bg-purple-100 text-purple-800" : "bg-amber-100 text-amber-800"}`}>
        <span>{saiu ? "A CAMINHO DO CLIENTE" : "RETIRAR NO RESTAURANTE"}</span>
        <span>Enviado às {hora(p.motoboy_enviado_em)}</span>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-3xl font-black leading-none">#{numeroDo(p)}</p>
            {mostrarRestaurante && restaurante?.nome && (
              <p className="text-xs font-semibold text-zinc-500 mt-1 flex items-center gap-1"><Store size={12} /> {restaurante.nome}</p>
            )}
            <p className="font-bold text-lg mt-1 truncate">{p.cliente}</p>
          </div>
          <p className="text-sm font-semibold text-zinc-500 whitespace-nowrap">
            Taxa {reais(p.taxa_entrega)}
            {p.distancia_km ? <span className="block text-right">{String(p.distancia_km).replace(".", ",")} km</span> : null}
          </p>
        </div>

        <div className="rounded-xl bg-zinc-50 p-3">
          <p className="font-bold flex items-start gap-1.5"><MapPin size={18} className="shrink-0 mt-0.5" style={{ color: COR }} /> {p.rua}, {p.numero}</p>
          <p className="text-sm text-zinc-700 ml-6">{p.bairro}</p>
          {p.complemento && <p className="text-sm text-zinc-700 ml-6">Compl.: {p.complemento}</p>}
          {p.referencia && <p className="text-sm text-zinc-700 ml-6">Ref.: {p.referencia}</p>}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(endereco)}&travelmode=driving`}
              target="_blank"
              rel="noreferrer"
              className="h-12 rounded-xl text-white font-bold flex items-center justify-center gap-2"
              style={{ backgroundColor: COR }}
            >
              <Navigation size={18} /> Google Maps
            </a>
            <a
              href={`https://waze.com/ul?q=${encodeURIComponent(endereco)}&navigate=yes`}
              target="_blank"
              rel="noreferrer"
              className="h-12 rounded-xl bg-sky-500 text-white font-bold flex items-center justify-center gap-2"
            >
              <Navigation size={18} /> Waze
            </a>
          </div>
        </div>

        <div className={`rounded-xl border-2 p-3 ${pagamento.classe}`}>
          <p className="font-black">{pagamento.titulo}</p>
          {pagamento.sub && <p className="text-sm font-semibold mt-0.5">{pagamento.sub}</p>}
        </div>

        {p.observacoes && (
          <p className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-sm">
            <span className="font-bold">Obs.:</span> {p.observacoes}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <a href={`tel:${p.telefone}`} className="h-12 rounded-xl border-2 font-bold flex items-center justify-center gap-2">
            <Phone size={18} /> Ligar
          </a>
          <a
            href={`https://wa.me/${soNumeroBR(p.telefone)}?text=${encodeURIComponent(textoCliente)}`}
            target="_blank"
            rel="noreferrer"
            className="h-12 rounded-xl border-2 border-green-600 text-green-700 font-bold flex items-center justify-center gap-2"
          >
            <FaWhatsapp size={20} /> WhatsApp
          </a>
        </div>

        <button onClick={() => setVerItens((v) => !v)} className="w-full flex items-center justify-between text-sm font-semibold text-zinc-600 py-1">
          Conferir itens ({qtd})
          <ChevronDown size={18} className={`transition ${verItens ? "rotate-180" : ""}`} />
        </button>
        {verItens && (
          <ul className="text-sm space-y-1 border-t pt-2">
            {(p.itens || []).map((i: any, k: number) => (
              <li key={k}>
                <span className="font-semibold">{i.quantity || 1}x {i.nome}</span>
                {i.obrigatoriosSelecionados?.length ? (
                  <span className="text-zinc-500"> · {i.obrigatoriosSelecionados.map((o: any) => o.nome).join(", ")}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {restaurante?.whatsapp && (
          <a
            href={`https://wa.me/${soNumeroBR(restaurante.whatsapp)}?text=${encodeURIComponent(`Sobre o pedido #${numeroDo(p)}: `)}`}
            target="_blank"
            rel="noreferrer"
            className="block text-center text-sm font-semibold text-zinc-500 underline"
          >
            Falar com o restaurante
          </a>
        )}

        {!saiu ? (
          <button
            disabled={enviando}
            onClick={() => acao("saiu")}
            className="w-full h-14 rounded-xl text-white text-lg font-black flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: COR }}
          >
            {enviando ? <Loader2 className="animate-spin" /> : "🛵"} Peguei — saí para entrega
          </button>
        ) : confirmar ? (
          <div className="grid grid-cols-[auto_1fr] gap-2">
            <button onClick={() => setConfirmar(false)} className="h-14 px-4 rounded-xl border-2 font-bold">Voltar</button>
            <button
              disabled={enviando}
              onClick={() => acao("entregue")}
              className="h-14 rounded-xl bg-green-600 text-white text-lg font-black flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {enviando ? <Loader2 className="animate-spin" /> : <Check />} Confirmar entrega
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmar(true)}
            className="w-full h-14 rounded-xl bg-green-600 text-white text-lg font-black flex items-center justify-center gap-2"
          >
            <Check /> Entreguei
          </button>
        )}
      </div>
    </article>
  );
}
