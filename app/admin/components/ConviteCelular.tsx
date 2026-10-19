"use client";

import { useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";
import { useNotificacaoCelular } from "./useNotificacaoCelular";

/** Convite discreto na tela de Pedidos para ligar o aviso no celular. */
export default function ConviteCelular() {
  const { estado, ligar } = useNotificacaoCelular();
  const [dispensado, setDispensado] = useState(true);

  useEffect(() => {
    try {
      setDispensado(localStorage.getItem("convite-celular") === "nao");
    } catch {}
  }, []);

  if (dispensado || !["desligado", "instalar-iphone"].includes(estado)) return null;

  function fechar() {
    try { localStorage.setItem("convite-celular", "nao"); } catch {}
    setDispensado(true);
  }

  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#6D1F2F]/20 bg-white p-3">
      <BellRing size={20} className="shrink-0 text-[#6D1F2F]" />
      <p className="flex-1 text-sm text-zinc-700">
        {estado === "instalar-iphone"
          ? "Quer aviso de pedido novo no iPhone? Adicione o painel à Tela de Início (Compartilhar → Adicionar)."
          : "Receba um aviso no celular a cada pedido novo, mesmo com o painel fechado."}
      </p>
      {estado === "desligado" && (
        <button onClick={() => ligar()} className="h-9 shrink-0 rounded-xl bg-[#6D1F2F] px-3 text-sm font-bold text-white">
          Ativar
        </button>
      )}
      <button onClick={fechar} aria-label="Dispensar" className="shrink-0 text-zinc-400">
        <X size={18} />
      </button>
    </div>
  );
}
