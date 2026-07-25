"use client";

import { X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function WhatsAppFloating() {
  const pathname = usePathname();

  const [mostrarMensagem, setMostrarMensagem] = useState(true);

  // =========================================================
  // DEFINE ONDE O WHATSAPP PODE APARECER
  // =========================================================

  // Páginas institucionais exatas
  const paginasPermitidas = [
    "/",
    "/faq",
    "/cadastro",
    "/login",
    "/recuperar-senha",
    "/redefinir-senha",
    "/privacidade",
    "/termos",
    "/cookies",
    "/contato",
  ];

  // Site institucional
  const estaNoSite = paginasPermitidas.includes(pathname);

  // Painel administrativo
  const estaNoAdmin =
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  // Se NÃO estiver no site institucional
  // e NÃO estiver no admin,
  // não mostra absolutamente nada.
  //
  // Isso elimina o WhatsApp dos cardápios:
  // /fornadapizzaria
  // /fornadapizzaria/carrinho
  // /qualquer-outro-restaurante
  if (!estaNoSite && !estaNoAdmin) {
    return null;
  }

  // =========================================================
  // CONFIGURAÇÃO DO WHATSAPP
  // =========================================================

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

          {/* FECHAR AVISO */}
          <button
            type="button"
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

      {/* BOTÃO WHATSAPP */}
      <a
        href={linkWhatsApp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar pelo WhatsApp"
        className="
          relative
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

        {/* EFEITO SUAVE */}
        <span
          className="
            absolute
            inset-0
            -z-10
            animate-ping
            rounded-full
            bg-[#25D366]/20
          "
        />

        {/* LOGO WHATSAPP */}
        <FaWhatsapp size={27} />

      </a>

    </div>
  );
}