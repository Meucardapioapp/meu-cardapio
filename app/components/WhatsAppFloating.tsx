"use client";

import { MessageCircle, X } from "lucide-react";
import { useState } from "react";

export default function WhatsAppFloating() {
  const [mostrarMensagem, setMostrarMensagem] = useState(true);

  const numero = "5592992338863";

  const mensagem =
    "Olá! Vim pelo site do MeuCardapioApp e gostaria de tirar uma dúvida.";

  const linkWhatsApp = `https://wa.me/${numero}?text=${encodeURIComponent(
    mensagem
  )}`;

  return (
    <div className="fixed bottom-4 right-3 z-[9999] flex items-center gap-2">

      {/* MINI AVISO */}
      {mostrarMensagem && (
        <div
          className="
            relative
            flex
            h-9
            items-center
            rounded-full
            border
            border-black/5
            bg-white
            pl-3.5
            pr-7
            shadow-[0_5px_18px_rgba(0,0,0,0.12)]
          "
        >
          <p className="whitespace-nowrap text-[9px] font-bold text-[#321017]">
            Dúvidas? Fale conosco
          </p>

          {/* FECHAR */}
          <button
            onClick={() => setMostrarMensagem(false)}
            aria-label="Fechar aviso"
            className="
              absolute
              right-1.5
              top-1/2
              flex
              h-4
              w-4
              -translate-y-1/2
              items-center
              justify-center
              rounded-full
              text-zinc-400
              transition
              hover:bg-zinc-100
              hover:text-zinc-700
            "
          >
            <X size={10} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* WHATSAPP */}
      <a
        href={linkWhatsApp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar pelo WhatsApp"
        className="
          flex
          h-12
          w-12
          shrink-0
          items-center
          justify-center
          rounded-full
          bg-[#25D366]
          text-white
          shadow-[0_6px_20px_rgba(37,211,102,0.30)]
          transition-all
          duration-300
          hover:scale-105
          active:scale-95
        "
      >
        <MessageCircle size={23} strokeWidth={2.2} />
      </a>

    </div>
  );
}