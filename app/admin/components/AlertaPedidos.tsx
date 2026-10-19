"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BellOff, Printer, Volume2, X } from "lucide-react";
import { apiFetch } from "@/utils/apiFetch";
import { supabase } from "@/lib/supabase";

type Pendente = {
  id: number;
  numero_pedido: number | null;
  nome?: string | null;
  cliente?: string | null;
  total: number;
};

const CHAVE_SOM = "painel-som-pedidos";
const CHAVE_IMPRESSAO = "painel-impressao-automatica";
const CHAVE_IMPRESSOS = "painel-pedidos-impressos";

function lerFlag(chave: string, padrao: boolean) {
  try {
    const v = localStorage.getItem(chave);
    return v === null ? padrao : v === "1";
  } catch {
    return padrao;
  }
}

function salvarFlag(chave: string, valor: boolean) {
  try {
    localStorage.setItem(chave, valor ? "1" : "0");
  } catch {}
}

function idsImpressos(): number[] {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_IMPRESSOS) || "[]");
  } catch {
    return [];
  }
}

/**
 * Alerta de pedidos novos para todo o painel:
 * - toca um sino em repetição enquanto houver pedido aguardando aceite;
 * - notificação do navegador, título da aba piscando e vibração;
 * - impressão automática opcional da comanda.
 */
export default function AlertaPedidos() {
  const pathname = usePathname();
  const [pendentes, setPendentes] = useState<Pendente[]>([]);
  const [somLigado, setSomLigado] = useState(true);
  const [impressaoAuto, setImpressaoAuto] = useState(false);
  const [audioLiberado, setAudioLiberado] = useState(false);
  const [painelAberto, setPainelAberto] = useState(false);

  const audioRef = useRef<AudioContext | null>(null);
  const conhecidosRef = useRef<Set<number> | null>(null);
  const tituloOriginal = useRef<string>("");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const filaImpressao = useRef<number[]>([]);

  useEffect(() => {
    setSomLigado(lerFlag(CHAVE_SOM, true));
    setImpressaoAuto(lerFlag(CHAVE_IMPRESSAO, false));
    tituloOriginal.current = document.title;
  }, []);

  // Navegadores só tocam som depois de um toque na página.
  const liberarAudio = useCallback(async () => {
    try {
      if (!audioRef.current) {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        audioRef.current = new Ctx();
      }
      if (audioRef.current.state === "suspended") await audioRef.current.resume();
      setAudioLiberado(audioRef.current.state === "running");
    } catch {
      setAudioLiberado(false);
    }
  }, []);

  useEffect(() => {
    const aoTocar = () => liberarAudio();
    window.addEventListener("pointerdown", aoTocar);
    window.addEventListener("keydown", aoTocar);
    return () => {
      window.removeEventListener("pointerdown", aoTocar);
      window.removeEventListener("keydown", aoTocar);
    };
  }, [liberarAudio]);

  const tocarSino = useCallback(() => {
    const ctx = audioRef.current;
    if (!ctx || ctx.state !== "running") return;

    const agora = ctx.currentTime;
    const notas = [
      { freq: 1046.5, inicio: 0 },
      { freq: 1318.5, inicio: 0.18 },
      { freq: 1568, inicio: 0.36 },
    ];

    for (const { freq, inicio } of notas) {
      const osc = ctx.createOscillator();
      const ganho = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      ganho.gain.setValueAtTime(0.0001, agora + inicio);
      ganho.gain.exponentialRampToValueAtTime(0.6, agora + inicio + 0.02);
      ganho.gain.exponentialRampToValueAtTime(0.0001, agora + inicio + 0.9);
      osc.connect(ganho).connect(ctx.destination);
      osc.start(agora + inicio);
      osc.stop(agora + inicio + 1);
    }
  }, []);

  const imprimirProximo = useCallback(() => {
    // Imprime um pedido por vez, com 8 s de intervalo entre eles.
    const proximo = () => {
      const id = filaImpressao.current.shift();
      if (id == null || !iframeRef.current) return;
      iframeRef.current.src = `/imprimir/${id}?auto=1`;
      setTimeout(proximo, 8000);
    };
    proximo();
  }, []);

  const verificar = useCallback(async () => {
    try {
      const resposta = await apiFetch("/api/painel/pendentes");
      if (!resposta.ok) return;
      const dados = await resposta.json();
      const lista: Pendente[] = dados.pedidos || [];

      // Primeira leitura: só memoriza, não dispara notificação/impressão de pedidos antigos.
      // Avisa o menu (o item "Pedidos" pisca até o dono abrir).
      window.dispatchEvent(new CustomEvent("pedidos-pendentes", { detail: lista.length }));

      if (conhecidosRef.current === null) {
        conhecidosRef.current = new Set(lista.map((p) => p.id));
        setPendentes(lista);
        return;
      }

      const novos = lista.filter((p) => !conhecidosRef.current!.has(p.id));
      novos.forEach((p) => conhecidosRef.current!.add(p.id));

      if (novos.length > 0) {
        window.dispatchEvent(new Event("novo-pedido"));

        if ("Notification" in window && Notification.permission === "granted") {
          for (const p of novos) {
            try {
              new Notification(`Novo pedido #${p.numero_pedido ?? p.id}`, {
                body: `${p.nome || p.cliente || "Cliente"} · ${Number(p.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
                tag: `pedido-${p.id}`,
              });
            } catch {}
          }
        }

        if (navigator.vibrate) navigator.vibrate([300, 150, 300]);

        if (lerFlag(CHAVE_IMPRESSAO, false)) {
          const impressos = idsImpressos();
          const paraImprimir = novos.map((p) => p.id).filter((id) => !impressos.includes(id));
          if (paraImprimir.length) {
            try {
              localStorage.setItem(CHAVE_IMPRESSOS, JSON.stringify([...impressos, ...paraImprimir].slice(-200)));
            } catch {}
            const vazia = filaImpressao.current.length === 0;
            filaImpressao.current.push(...paraImprimir);
            if (vazia) imprimirProximo();
          }
        }
      }

      setPendentes(lista);
    } catch {
      // sem conexão: tenta no próximo ciclo
    }
  }, [imprimirProximo]);

  // Consulta periódica + tempo real.
  useEffect(() => {
    verificar();
    const intervalo = setInterval(verificar, 10000);
    window.addEventListener("pedidos-atualizados", verificar);

    const restauranteId = localStorage.getItem("restaurante_id");
    const canal = supabase
      .channel(`alerta-${restauranteId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos", filter: `restaurante_id=eq.${restauranteId}` },
        () => verificar()
      )
      .subscribe();

    return () => {
      clearInterval(intervalo);
      window.removeEventListener("pedidos-atualizados", verificar);
      supabase.removeChannel(canal);
    };
  }, [verificar]);

  // Som em repetição + título piscando enquanto houver pedido novo.
  useEffect(() => {
    if (pendentes.length === 0) {
      if (tituloOriginal.current) document.title = tituloOriginal.current;
      return;
    }

    let alterna = false;
    if (somLigado) tocarSino();

    const intervalo = setInterval(() => {
      if (somLigado) tocarSino();
      alterna = !alterna;
      document.title = alterna
        ? `🔔 (${pendentes.length}) Novo pedido!`
        : tituloOriginal.current || "MeuCardápio";
    }, 4000);

    return () => clearInterval(intervalo);
  }, [pendentes.length, somLigado, tocarSino, audioLiberado]);

  async function alternarSom() {
    const novo = !somLigado;
    setSomLigado(novo);
    salvarFlag(CHAVE_SOM, novo);
    if (novo) {
      await liberarAudio();
      tocarSino();
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }
  }

  function alternarImpressao() {
    const novo = !impressaoAuto;
    setImpressaoAuto(novo);
    salvarFlag(CHAVE_IMPRESSAO, novo);
  }

  const qtd = pendentes.length;
  const naPaginaPedidos = pathname === "/admin/pedidos";

  return (
    <>
      {/* Botão do sino (fica no topo, ao lado do menu) */}
      <div className="fixed top-2.5 right-3 z-[65] lg:right-6">
        <button
          onClick={() => setPainelAberto((v) => !v)}
          aria-label="Alertas de pedidos"
          className={`relative w-11 h-11 rounded-xl shadow-lg flex items-center justify-center ${
            qtd > 0 ? "bg-amber-500 text-white animate-pulse" : "bg-white text-zinc-800"
          }`}
        >
          {somLigado ? <Bell size={20} /> : <BellOff size={20} />}
          {qtd > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
              {qtd}
            </span>
          )}
        </button>

        {painelAberto && (
          <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white shadow-2xl border p-4 text-sm text-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold">Alertas de pedido</p>
              <button onClick={() => setPainelAberto(false)} aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            <label className="flex items-center justify-between py-2">
              <span className="flex items-center gap-2"><Volume2 size={16} /> Som de novo pedido</span>
              <input type="checkbox" checked={somLigado} onChange={alternarSom} className="w-5 h-5" />
            </label>

            <label className="flex items-center justify-between py-2">
              <span className="flex items-center gap-2"><Printer size={16} /> Imprimir automaticamente</span>
              <input type="checkbox" checked={impressaoAuto} onChange={alternarImpressao} className="w-5 h-5" />
            </label>

            <button
              onClick={async () => {
                await liberarAudio();
                tocarSino();
              }}
              className="mt-2 w-full h-10 rounded-xl bg-zinc-100 font-semibold"
            >
              Testar som
            </button>

            <p className="mt-3 text-xs text-zinc-500 leading-5">
              Deixe esta aba aberta e o volume ligado. No celular, mantenha a tela acesa.
              Impressão automática: abre a comanda sozinha quando chega pedido.
            </p>
          </div>
        )}
      </div>

      {/* Aviso para liberar o som (exigência dos navegadores) */}
      {somLigado && !audioLiberado && (
        <button
          onClick={liberarAudio}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[65] lg:bottom-6 whitespace-nowrap rounded-full bg-zinc-900 text-white px-4 py-2.5 text-sm font-semibold shadow-2xl flex items-center gap-2"
        >
          <Bell size={16} /> Toque para ativar o som
        </button>
      )}

      {/* Faixa de pedido novo em qualquer tela do painel */}
      {qtd > 0 && !naPaginaPedidos && (
        <Link
          href="/admin/pedidos"
          className="fixed bottom-40 left-1/2 -translate-x-1/2 z-[64] lg:bottom-auto lg:top-14 whitespace-nowrap rounded-full bg-amber-500 text-white px-5 py-3 text-sm font-bold shadow-2xl"
        >
          🔔 {qtd === 1 ? "1 pedido novo" : `${qtd} pedidos novos`} — ver agora
        </Link>
      )}

      <iframe ref={iframeRef} title="impressao" aria-hidden className="fixed -left-[9999px] top-0 w-[80mm] h-[200px] border-0" />
    </>
  );
}
