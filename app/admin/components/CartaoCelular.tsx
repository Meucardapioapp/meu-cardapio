"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Smartphone } from "lucide-react";
import { useNotificacaoCelular } from "./useNotificacaoCelular";

export function Chave({ ligado, onClick, desabilitado }: { ligado: boolean; onClick: () => void; desabilitado?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      disabled={desabilitado}
      onClick={onClick}
      className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-40 ${ligado ? "bg-green-600" : "bg-zinc-300"}`}
    >
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${ligado ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

export function CartaoCelular() {
  const { estado, ligar, desligar } = useNotificacaoCelular();
  const [ocupado, setOcupado] = useState(false);

  async function alternar() {
    setOcupado(true);
    try {
      if (estado === "ligado") await desligar();
      else if (!(await ligar())) toast.error("Não foi possível ligar. Confira se o navegador permitiu notificações.");
    } finally {
      setOcupado(false);
    }
  }

  const textos: Record<string, string> = {
    carregando: "Verificando…",
    indisponivel: "Será ativado na atualização do sistema.",
    "sem-suporte": "Este navegador não aceita notificações. No celular, use o Chrome (Android) ou o Safari (iPhone).",
    "instalar-iphone":
      "No iPhone: toque em Compartilhar (□↑) → “Adicionar à Tela de Início”. Depois abra o painel pelo ícone e ligue aqui.",
    bloqueado: "As notificações foram bloqueadas. Libere nas configurações do navegador (cadeado ao lado do endereço).",
    desligado: "Ligue para receber um aviso a cada pedido novo, mesmo com o painel fechado.",
    ligado: "Ligado neste aparelho. Repita em cada celular que deve avisar.",
  };

  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#6D1F2F]/10 text-[#6D1F2F]">
          <Smartphone size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">Aviso de pedido novo neste celular</p>
          <p className="mt-1 text-sm text-zinc-500">{textos[estado]}</p>
        </div>
        {ocupado ? (
          <Loader2 className="animate-spin text-zinc-400" />
        ) : (
          <Chave
            ligado={estado === "ligado"}
            desabilitado={!["ligado", "desligado"].includes(estado)}
            onClick={alternar}
          />
        )}
      </div>
    </div>
  );
}

