"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  House,
  Star,
  LayoutDashboard,
  CircleHelp,
  MessageCircle,
  ArrowRight,
  Mail,
  Camera,
  UtensilsCrossed,
} from "lucide-react";

export default function NavbarMobile() {
  const [open, setOpen] = useState(false);

  const fechar = () => setOpen(false);

  return (
    <>
      {/* =====================================================
          NAVBAR MOBILE
      ===================================================== */}
     
<header
  className="
    sticky
    top-0
    z-50
    bg-[#100608]
    text-white
  "
>
  {/* GLOW PARA CONECTAR COM O HERO */}
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    <div
      className="
        absolute
        -right-16
        -top-24
        h-52
        w-52
        rounded-full
        bg-[#8D1835]/20
        blur-[80px]
      "
    />
  </div>

<div
  className="
    relative
    mx-auto
    flex
    h-[72px]
    w-full
    max-w-[430px]
    items-center
    px-4
  "
>
    {/* MENU */}
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Abrir menu"
      className="
        group
        flex
        h-11
        w-11
        shrink-0
        items-center
        justify-center
        rounded-full

        border
        border-white/10
        bg-white/[0.04]

        text-white

        transition-all
        duration-300

        hover:border-[#C62E50]/50
        hover:bg-[#6D1F2F]/20

        active:scale-90
      "
    >
      <Menu
        size={22}
        strokeWidth={1.8}
        className="transition-transform duration-300 group-hover:scale-110"
      />
    </button>

    {/* LOGO CENTRAL */}
<Link
  href="/"
  className="
    absolute
    left-1/2
    top-1/2
    -translate-x-1/2
    -translate-y-1/2
    whitespace-nowrap
    transition-transform
    duration-300
    active:scale-95
  "
>
  <span
    className="
      text-[17px]
      font-black
      tracking-[-0.05em]
      text-white
    "
  >
    MeuCardápio
  </span>

  <span
    className="
      text-[17px]
      font-black
      tracking-[-0.05em]
      text-[#C62E50]
    "
  >
    App
  </span>
</Link>

    {/* BOTÃO */}
    <Link
      href="/cadastro"
      className="
        flex
        ml-auto
        h-10
        shrink-0
        items-center
        justify-center
        rounded-full

        bg-gradient-to-r
        from-[#791D34]
        to-[#C62E50]

        px-3

        text-[11px]
        font-extrabold
        text-white

        shadow-[0_8px_25px_rgba(109,31,47,0.30)]

        transition-all
        duration-300

        hover:-translate-y-0.5

        active:translate-y-0
        active:scale-95
      "
    >
      Criar grátis
    </Link>
  </div>
</header>


      {/* =====================================================
          OVERLAY
      ===================================================== */}
      <div
        onClick={fechar}
        className={`
          fixed
          inset-0
          z-[60]

          bg-black/65
          backdrop-blur-[3px]

          transition-all
          duration-300

          ${
            open
              ? "visible opacity-100"
              : "invisible opacity-0"
          }
        `}
      />

      {/* =====================================================
          DRAWER
      ===================================================== */}
      <aside
        className={`
          fixed
          left-0
          top-0
          z-[70]

          flex
          h-[100dvh]
          w-[86%]
          max-w-[340px]
          flex-col

          overflow-y-auto

          border-r
          border-white/10

          bg-[#16070A]
          text-white

          shadow-[25px_0_70px_rgba(0,0,0,0.45)]

          transition-transform
          duration-300
          ease-out

          ${
            open
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* =================================================
            CABEÇALHO DRAWER
        ================================================= */}
        <div className="relative border-b border-white/10 px-6 pb-5 pt-6">

          {/* LUZ */}
          <div
            className="
              pointer-events-none
              absolute
              -left-16
              -top-16
              h-40
              w-40
              rounded-full
              bg-[#6D1F2F]/30
              blur-[60px]
            "
          />

          <div className="relative flex items-start justify-between">

            {/* MARCA */}
            <Link
              href="/"
              onClick={fechar}
              className="
                transition
                duration-300
                active:scale-95
              "
            >
              <div
                className="
                  text-[28px]
                  font-black
                  leading-[0.9]
                  tracking-[-0.05em]
                "
              >
                Meu
              </div>

              <div
                className="
                  mt-1.5
                  text-[17px]
                  font-bold
                  leading-none
                  tracking-[-0.04em]
                "
              >
                <span className="text-white">
                  Cardápio
                </span>

                <span className="text-[#C32F50]">
                  App
                </span>
              </div>

              <p className="mt-3 text-[11px] text-zinc-500">
                Seu delivery. Sua marca.
              </p>
            </Link>

            {/* FECHAR */}
            <button
              type="button"
              onClick={fechar}
              aria-label="Fechar menu"
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full

                border
                border-white/10
                bg-white/5

                text-zinc-300

                transition-all
                duration-300

                hover:bg-white/10
                hover:text-white

                active:scale-90
              "
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* =================================================
            LINKS
        ================================================= */}
        <div className="flex flex-1 flex-col px-5 py-5">

          <p
            className="
              mb-2
              px-3
              text-[9px]
              font-bold
              uppercase
              tracking-[0.2em]
              text-zinc-600
            "
          >
            Navegação
          </p>

          <nav className="space-y-1">

            <a
              href="#como-funciona"
              onClick={fechar}
              className="
                group
                flex
                items-center
                gap-3
                rounded-xl
                px-3
                py-3.5

                text-[14px]
                font-medium
                text-zinc-300

                transition-all
                duration-300

                hover:bg-white/[0.05]
                hover:text-white

                active:scale-[0.98]
              "
            >
              <span
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full

                  bg-[#6D1F2F]/20
                  text-[#D94B68]

                  transition
                  group-hover:bg-[#6D1F2F]/35
                "
              >
                <House size={17} />
              </span>

              Como funciona
            </a>

            <a
              href="#beneficios"
              onClick={fechar}
              className="
                group
                flex
                items-center
                gap-3
                rounded-xl
                px-3
                py-3.5
                text-[14px]
                font-medium
                text-zinc-300

                transition-all
                duration-300

                hover:bg-white/[0.05]
                hover:text-white

                active:scale-[0.98]
              "
            >
              <span
                className="
                  flex h-9 w-9
                  items-center justify-center
                  rounded-full
                  bg-[#6D1F2F]/20
                  text-[#D94B68]
                  transition
                  group-hover:bg-[#6D1F2F]/35
                "
              >
                <Star size={17} />
              </span>

              Benefícios
            </a>

            <a
              href="#dashboard"
              onClick={fechar}
              className="
                group
                flex
                items-center
                gap-3
                rounded-xl
                px-3
                py-3.5
                text-[14px]
                font-medium
                text-zinc-300

                transition-all
                duration-300

                hover:bg-white/[0.05]
                hover:text-white

                active:scale-[0.98]
              "
            >
              <span
                className="
                  flex h-9 w-9
                  items-center justify-center
                  rounded-full
                  bg-[#6D1F2F]/20
                  text-[#D94B68]
                  transition
                  group-hover:bg-[#6D1F2F]/35
                "
              >
                <LayoutDashboard size={17} />
              </span>

              Dashboard
            </a>

            <a
              href="#faq"
              onClick={fechar}
              className="
                group
                flex
                items-center
                gap-3
                rounded-xl
                px-3
                py-3.5
                text-[14px]
                font-medium
                text-zinc-300

                transition-all
                duration-300

                hover:bg-white/[0.05]
                hover:text-white

                active:scale-[0.98]
              "
            >
              <span
                className="
                  flex h-9 w-9
                  items-center justify-center
                  rounded-full
                  bg-[#6D1F2F]/20
                  text-[#D94B68]
                  transition
                  group-hover:bg-[#6D1F2F]/35
                "
              >
                <CircleHelp size={17} />
              </span>

              Dúvidas frequentes
            </a>
          </nav>

          {/* DIVISOR */}
          <div className="my-5 h-px bg-white/10" />

          {/* =================================================
              CTA PRINCIPAL
          ================================================= */}
          <Link
            href="/cadastro"
            onClick={fechar}
            className="
              group
              flex
              min-h-[54px]
              items-center
              justify-center
              gap-2.5
              rounded-full

              bg-gradient-to-r
              from-[#8E2340]
              to-[#C32F50]

              px-5

              text-[13px]
              font-black
              uppercase
              text-white

              shadow-[0_12px_35px_rgba(109,31,47,0.35)]

              transition-all
              duration-300

              hover:-translate-y-0.5
              hover:shadow-[0_15px_40px_rgba(195,47,80,0.40)]

              active:translate-y-0
              active:scale-[0.97]
            "
          >
            Criar meu cardápio

            <ArrowRight
              size={17}
              className="
                transition-transform
                duration-300
                group-hover:translate-x-1
              "
            />
          </Link>

          {/* LOGIN */}
          <Link
            href="/login"
            onClick={fechar}
            className="
              mt-3
              flex
              min-h-[50px]
              items-center
              justify-center
              rounded-full

              border
              border-white/10

              bg-white/[0.03]

              text-[13px]
              font-semibold
              text-zinc-300

              transition-all
              duration-300

              hover:bg-white/[0.07]
              hover:text-white

              active:scale-[0.97]
            "
          >
            Já tenho uma conta
          </Link>

          {/* =================================================
              CONTATO
          ================================================= */}
          <div className="mt-auto pt-7">

            <div className="mb-5 h-px bg-white/10" />

            <p
              className="
                mb-4
                px-1
                text-[9px]
                font-bold
                uppercase
                tracking-[0.2em]
                text-zinc-600
              "
            >
              Fale com a gente
            </p>

            <div className="space-y-3">

              <a
                href="#"
                className="
                  flex
                  items-center
                  gap-3
                  text-[12px]
                  text-zinc-400
                  transition
                  hover:text-white
                  active:scale-[0.98]
                "
              >
                <Camera
                  size={17}
                  className="text-[#D94B68]"
                />

                Instagram
              </a>

              <a
                href="https://wa.me/5592992338863"
                target="_blank"
                rel="noopener noreferrer"
                className="
                  flex
                  items-center
                  gap-3
                  text-[12px]
                  text-zinc-400
                  transition
                  hover:text-white
                  active:scale-[0.98]
                "
              >
                <MessageCircle
                  size={17}
                  className="text-[#D94B68]"
                />

                WhatsApp
              </a>

              <a
                href="mailto:contatomeucardapio@gmail.com"
                className="
                  flex
                  items-center
                  gap-3
                  text-[12px]
                  text-zinc-400
                  transition
                  hover:text-white
                  active:scale-[0.98]
                "
              >
                <Mail
                  size={17}
                  className="text-[#D94B68]"
                />

                contatomeucardapio@gmail.com
              </a>

            </div>
          </div>

        </div>
      </aside>
    </>
  );
}