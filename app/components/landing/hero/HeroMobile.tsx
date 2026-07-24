"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bike,
  Check,
  CircleDollarSign,
  Rocket,
  ShoppingBag,
  Smartphone,
} from "lucide-react";

export default function HeroMobile() {
  const beneficios = [
    {
      titulo: "Cardápio digital",
      descricao: "com a sua cara",
      Icone: Smartphone,
    },
    {
      titulo: "Pedidos online",
      descricao: "direto no seu link",
      Icone: ShoppingBag,
    },
    {
      titulo: "Mais pedidos",
      descricao: "e mais resultados",
      Icone: Bike,
    },
    {
      titulo: "Sem mensalidade",
      descricao: "e sem complicação",
      Icone: CircleDollarSign,
    },
  ];

  return (
    <section
      className="
        relative
        overflow-hidden
        bg-[#100608]
        text-white
      "
    >
      {/* =====================================================
          FUNDO / GLOW
      ===================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          right-[-150px]
          top-[100px]
          h-[430px]
          w-[430px]
          rounded-full
          bg-[#8D1835]/25
          blur-[120px]
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          left-[-180px]
          top-[420px]
          h-[400px]
          w-[400px]
          rounded-full
          bg-[#6D1F2F]/20
          blur-[130px]
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          bottom-[-180px]
          right-[-120px]
          h-[420px]
          w-[420px]
          rounded-full
          bg-[#B52B49]/10
          blur-[140px]
        "
      />

      {/* textura/gradiente superior */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          bg-[radial-gradient(circle_at_75%_25%,rgba(181,43,73,0.12),transparent_35%)]
        "
      />

      {/* =====================================================
          CONTEÚDO
      ===================================================== */}

      <div className="relative z-10 mx-auto w-full max-w-[430px] px-5 pb-10 pt-8">

        {/* =====================================================
            TAG
        ===================================================== */}

        <div>
          <span
            className="
              inline-flex
              items-center
              rounded-full
              border
              border-[#A62945]/80
              bg-[#6D1F2F]/10
              px-4
              py-1.5
              text-[9px]
              font-bold
              uppercase
              tracking-[0.19em]
              text-zinc-200
              backdrop-blur-sm
            "
          >
            O cardápio digital
          </span>
        </div>

        {/* =====================================================
            HERO PRINCIPAL
        ===================================================== */}

        <div className="relative mt-5 min-h-[480px]">

          {/* ===================================================
              TEXTO ESQUERDA
          =================================================== */}

          <div className="relative z-20 w-[56%]">

            {/* TÍTULO */}

            <h1
              className="
                text-[34px]
                font-black
                leading-[0.98]
                tracking-[-0.05em]
                text-white
              "
            >
              Perfeito para

              <span className="mt-1 block text-[#C62E50]">
                o seu negócio
              </span>
            </h1>

            {/* DESCRIÇÃO */}

            <p
              className="
                mt-5
                max-w-[205px]
                text-[13px]
                leading-[1.6]
                text-zinc-300
              "
            >
              Tenha seu cardápio digital, receba pedidos online e venda mais sem
              depender de aplicativos de delivery.
            </p>

            {/* =================================================
                BENEFÍCIOS
            ================================================= */}

            <div className="mt-7 space-y-2.5">

              {beneficios.map(({ titulo, descricao, Icone }) => (
                <div
                  key={titulo}
                  className="
                    group
                    -ml-2
                    flex
                    w-fit
                    items-center
                    gap-3
                    rounded-2xl
                    px-2
                    py-1.5

                    transition-all
                    duration-300
                    ease-out

                    hover:translate-x-1
                    hover:bg-white/[0.035]

                    active:scale-[0.96]
                    active:bg-white/[0.06]
                  "
                >

                  {/* ÍCONE */}

                  <div
                    className="
                      flex
                      h-[42px]
                      w-[42px]
                      shrink-0
                      items-center
                      justify-center
                      rounded-full

                      border
                      border-[#9B2942]/50

                      bg-gradient-to-br
                      from-[#84243B]
                      to-[#5B1728]

                      shadow-[0_8px_24px_rgba(109,31,47,0.28)]

                      transition-all
                      duration-300

                      group-hover:scale-110
                      group-hover:shadow-[0_10px_30px_rgba(181,43,73,0.35)]

                      group-active:scale-95
                    "
                  >
                    <Icone
                      size={19}
                      strokeWidth={1.8}
                      className="text-white"
                    />
                  </div>

                  {/* TEXTO */}

                  <div className="leading-tight">

                    <p className="whitespace-nowrap text-[13.5px] font-bold text-white">
                      {titulo}
                    </p>

                    <p className="mt-1 whitespace-nowrap text-[12px] text-zinc-400">
                      {descricao}
                    </p>

                  </div>

                </div>
              ))}

            </div>

          </div>

 {/* ===================================================
    CELULAR
=================================================== */}

<div
  className="
    absolute
    right-[-35px]
    top-[15px]
    z-10
    h-[460px]
    w-[62%]

    transition-transform
    duration-500
    ease-out

    hover:scale-[1.025]
    hover:-translate-y-1

    active:scale-[0.985]
  "
>
  {/* GLOW ATRÁS DO CELULAR */}
  <div
    className="
      pointer-events-none
      absolute
      left-1/2
      top-1/2
      h-[300px]
      w-[190px]
      -translate-x-1/2
      -translate-y-1/2
      rounded-full
      bg-[#B52B49]/20
      blur-[65px]
    "
  />

  <Image
    src="/images/celular-hero.png"
    alt="Cardápio digital Fornada Pizzaria"
    fill
    priority
    sizes="62vw"
    className="
      relative
      z-10
      object-contain
      object-center
      drop-shadow-[0_28px_38px_rgba(0,0,0,0.55)]
    "
  />
</div>

        </div>

        {/* =====================================================
            CTA
        ===================================================== */}

        <div className="relative z-30 -mt-1">

          {/* LINHA */}

          <div
            className="
              mx-auto
              mb-6
              h-px
              w-[78%]
              bg-gradient-to-r
              from-transparent
              via-[#8F263D]
              to-transparent
            "
          />

          {/* CHAMADA */}

          <div className="text-center">

            <p className="text-[20px] font-bold tracking-[-0.02em] text-white">
              Crie seu cardápio{" "}
              <span className="text-[#C62E50]">
                grátis
              </span>
            </p>

            <p className="mt-1.5 text-[14px] text-zinc-300">
              e comece agora mesmo!
            </p>

          </div>

          {/* ===================================================
              BOTÃO
          =================================================== */}

          <Link
            href="/cadastro"
            className="
              group

              mx-auto
              mt-5

              flex
              min-h-[58px]
              w-full
              max-w-[355px]

              items-center
              justify-center
              gap-3

              rounded-full

              border
              border-white/[0.06]

              bg-gradient-to-r
              from-[#791D34]
              via-[#9D2542]
              to-[#C62E50]

              px-5

              text-[14px]
              font-black
              uppercase
              tracking-[-0.01em]
              text-white

              shadow-[0_15px_45px_rgba(109,31,47,0.40)]

              transition-all
              duration-300
              ease-out

              hover:-translate-y-1
              hover:shadow-[0_20px_55px_rgba(181,43,73,0.48)]

              active:translate-y-0
              active:scale-[0.97]
            "
          >

            <Rocket
              size={20}
              strokeWidth={1.8}
              className="
                transition-transform
                duration-300
                group-hover:-translate-y-0.5
                group-hover:translate-x-0.5
              "
            />

            <span>
              Criar meu cardápio grátis
            </span>

            <ArrowRight
              size={18}
              className="
                transition-transform
                duration-300
                group-hover:translate-x-1
              "
            />

          </Link>

          {/* ===================================================
              MICRO BENEFÍCIOS
          =================================================== */}

          <div
            className="
              mt-5
              flex
              items-center
              justify-center
              gap-3
              text-[10px]
              text-zinc-400
            "
          >

            <span className="flex items-center gap-1.5">
              <Check
                size={12}
                strokeWidth={2.2}
                className="text-[#C62E50]"
              />

              Sem mensalidade
            </span>

            <span className="h-1 w-1 rounded-full bg-[#8F263D]" />

            <span className="flex items-center gap-1.5">
              <Check
                size={12}
                strokeWidth={2.2}
                className="text-[#C62E50]"
              />

              Configure em poucos minutos
            </span>

          </div>

          {/* ===================================================
              DEMONSTRAÇÃO
          =================================================== */}

          <Link
            href="/fornadapizzaria"
            className="
              mx-auto
              mt-5
              block
              w-fit

              text-[11px]
              font-medium
              text-zinc-500

              underline
              decoration-zinc-700
              underline-offset-4

              transition-all
              duration-300

              hover:text-zinc-200
              hover:decoration-zinc-400

              active:scale-95
            "
          >
            Ver um cardápio de demonstração
          </Link>

        </div>

      </div>
    </section>
  );
}