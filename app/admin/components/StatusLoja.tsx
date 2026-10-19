"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/utils/apiFetch";

type Estado = {
  operacao: { pausado: boolean; pausadoAte: string | null };
  abertoPeloHorario: boolean;
  temHorario: boolean;
};

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

/**
 * Situação da loja no topo do painel: recebendo pedidos, pausado ou
 * fechado pelo horário. Um toque pausa por 30 min, 1 h ou até reativar.
 */
export default function StatusLoja({ compacto = false }: { compacto?: boolean }) {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);

  const carregar = useCallback(() => {
    apiFetch("/api/painel/operacao")
      .then((r) => r.json())
      .then((d) => d?.success && setEstado(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    carregar();
    const t = setInterval(carregar, 60000);
    return () => clearInterval(t);
  }, [carregar]);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [aberto]);

  async function enviar(corpo: object, mensagem: string) {
    setSalvando(true);
    try {
      const d = await apiFetch("/api/painel/operacao", { method: "PUT", body: JSON.stringify(corpo) }).then((r) => r.json());
      if (!d?.success) {
        toast.error(d?.error || "Não foi possível alterar.");
        return;
      }
      setEstado(d);
      setAberto(false);
      toast.success(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  if (!estado) return null;

  const pausado = estado.operacao.pausado;
  const fechado = !pausado && !estado.abertoPeloHorario;

  const cor = pausado ? "bg-amber-500" : fechado ? "bg-zinc-400" : "bg-green-500";
  const texto = pausado
    ? estado.operacao.pausadoAte
      ? `Pausado até ${hora(estado.operacao.pausadoAte)}`
      : "Pedidos pausados"
    : fechado
    ? "Fechado agora"
    : "Recebendo pedidos";
  const textoCurto = pausado ? "Pausado" : fechado ? "Fechado" : "Aberto";

  return (
    <div ref={caixa} className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        className={`h-10 rounded-full border bg-white px-3 flex items-center gap-2 text-sm font-semibold shadow-sm ${
          pausado ? "border-amber-300 text-amber-800" : fechado ? "border-zinc-200 text-zinc-600" : "border-green-200 text-green-800"
        }`}
      >
        <span className={`w-2.5 h-2.5 rounded-full ${cor} ${!pausado && !fechado ? "animate-pulse" : ""}`} />
        {compacto ? textoCurto : texto}
      </button>

      {aberto && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border shadow-2xl p-4 z-[90] text-sm text-zinc-800">
          {pausado ? (
            <>
              <p className="font-bold">Pedidos pausados</p>
              <p className="mt-1 text-zinc-500">
                Os clientes veem o cardápio, mas não conseguem finalizar pedidos
                {estado.operacao.pausadoAte ? ` até ${hora(estado.operacao.pausadoAte)}` : ""}.
              </p>
              <button
                disabled={salvando}
                onClick={() => enviar({ acao: "retomar" }, "Pronto! Você voltou a receber pedidos.")}
                className="mt-3 w-full h-11 rounded-xl bg-green-600 text-white font-bold flex items-center justify-center gap-2"
              >
                {salvando && <Loader2 size={16} className="animate-spin" />}
                Voltar a receber pedidos
              </button>
            </>
          ) : (
            <>
              <p className="font-bold">{fechado ? "Fechado pelo horário" : "Recebendo pedidos"}</p>
              <p className="mt-1 text-zinc-500">
                {fechado
                  ? estado.temHorario
                    ? "Fora do horário de funcionamento. Os clientes não conseguem pedir agora."
                    : "Você ainda não cadastrou o horário de funcionamento."
                  : "Cozinha cheia? Pause os pedidos online por um tempo."}
              </p>
              {fechado && (
                <Link href="/admin/horarios" onClick={() => setAberto(false)} className="mt-2 inline-block font-semibold text-[#6D1F2F] underline">
                  Ver horários
                </Link>
              )}
              {!fechado && (
                <div className="mt-3 grid gap-2">
                  {[
                    { minutos: 30, rotulo: "Pausar por 30 minutos" },
                    { minutos: 60, rotulo: "Pausar por 1 hora" },
                    { minutos: null, rotulo: "Pausar até eu reativar" },
                  ].map((o) => (
                    <button
                      key={o.rotulo}
                      disabled={salvando}
                      onClick={() => enviar({ acao: "pausar", minutos: o.minutos }, "Pedidos pausados.")}
                      className="h-11 rounded-xl border font-semibold hover:bg-zinc-50"
                    >
                      {o.rotulo}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
