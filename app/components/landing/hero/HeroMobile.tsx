"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  Smartphone,
  ShoppingBag,
  Bike,
  CircleDollarSign,
  Rocket,
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
    <section className="relative overflow-hidden bg-[#16070A] text-white">

      {/* LUZ DE FUNDO */}
      <div className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-[#6D1F2F]/25 blur-[90px]" />

      <div className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-[#6D1F2F]/15 blur-[90px]" />

      {/* CONTEÚDO */}
      <div className="relative z-10 mx-auto w-full max-w-xl px-5 pb-9 pt-5">

        {/* ==================================================
            MARCA
        ================================================== */}
        <div className="relative z-30">
          <div className="text-[34px] font-black leading-[0.85] tracking-[-0.05em]">
            Meu
          </div>

          <div className="mt-1.5 text-[19px] font-bold leading-none tracking-[-0.04em]">
            <span className="text-white">
              Cardápio
            </span>

            <span className="text-[#C32F50]">
              App
            </span>
          </div>
        </div>

        {/* ==================================================
            TAG
        ================================================== */}
        <div className="relative z-30 mt-6">
          <span
            className="
              inline-flex
              rounded-full
              border border-[#8F263D]
              bg-[#6D1F2F]/10
              px-4 py-1.5
              text-[9px]
              font-semibold
              uppercase
              tracking-[0.20em]
              text-zinc-200
              transition-all
              duration-300
              active:scale-95
              active:bg-[#6D1F2F]/25
            "
          >
            O cardápio digital
          </span>
        </div>

        {/* ==================================================
            ÁREA PRINCIPAL
        ================================================== */}
        <div className="relative mt-4 min-h-[350px]">

          {/* ==================================================
              CONTEÚDO ESQUERDO
          ================================================== */}
          <div className="relative z-20 w-[56%]">

            {/* TÍTULO */}
            <h1 className="text-[31px] font-black leading-[1.02] tracking-[-0.045em]">
              Perfeito para
              <br />

              <span className="text-[#C32F50]">
                o seu negócio
              </span>
            </h1>

            {/* DESCRIÇÃO */}
            <p className="mt-4 max-w-[190px] text-[13px] leading-[1.55] text-zinc-300">
              Tenha seu cardápio digital, receba pedidos online e venda mais sem
              depender de aplicativos de delivery.
            </p>

            {/* ==================================================
                BENEFÍCIOS
            ================================================== */}
            <div className="mt-5 space-y-2">

              {beneficios.map(({ titulo, descricao, Icone }) => (
                <div
                  key={titulo}
                  className="
                    group
                    -ml-2
                    flex
                    w-fit
                    items-center
                    gap-2.5
                    rounded-2xl
                    px-2
                    py-1.5
                    transition-all
                    duration-300
                    ease-out

                    hover:bg-white/[0.04]
                    hover:translate-x-1

                    active:scale-[0.96]
                    active:bg-white/[0.07]
                  "
                >

                  {/* ÍCONE */}
                  <div
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      border
                      border-[#8F263D]/60
                      bg-[#6D1F2F]
                      shadow-[0_5px_18px_rgba(109,31,47,0.22)]
                      transition-all
                      duration-300

                      group-hover:scale-110
                      group-hover:bg-[#84253A]

                      group-active:scale-90
                    "
                  >
                    <Icone
                      size={18}
                      strokeWidth={1.8}
                      className="text-white"
                    />
                  </div>

                  {/* TEXTO */}
                  <div className="leading-tight">
                    <p className="whitespace-nowrap text-[13px] font-bold text-white">
                      {titulo}
                    </p>

                    <p className="mt-0.5 whitespace-nowrap text-[11.5px] text-zinc-400">
                      {descricao}
                    </p>
                  </div>

                </div>
              ))}

            </div>
          </div>

          {/* ==================================================
              CELULAR
          ================================================== */}
          <div
            className="
              absolute
              -right-14
              top-[-30px]
              z-10
              h-[480px]
              w-[66%]
              transition-transform
              duration-500
              ease-out

              hover:scale-[1.035]
              hover:-translate-y-1

              active:scale-[0.98]
            "
          >
            <Image
              src="/images/celular-hero.png"
              alt="Cardápio digital Fornada Pizzaria"
              fill
              priority
              sizes="66vw"
              className="
                object-contain
                object-center
                drop-shadow-[0_20px_30px_rgba(0,0,0,0.45)]
              "
            />
          </div>

        </div>

        {/* ==================================================
            DIVISOR
        ================================================== */}
        <div className="relative z-30 mx-auto mt-1 h-px w-[78%] bg-gradient-to-r from-transparent via-[#6D1F2F] to-transparent" />

        {/* ==================================================
            CTA
        ================================================== */}
        <div className="relative z-30 mt-5">

          {/* TEXTO CTA */}
          <div className="text-center">
            <p className="text-[19px] font-bold leading-tight">
              Crie seu cardápio{" "}

              <span className="text-[#C32F50]">
                grátis
              </span>
            </p>

            <p className="mt-1.5 text-[14px] text-zinc-300">
              e comece agora mesmo!
            </p>
          </div>

          {/* BOTÃO PRINCIPAL */}
          <Link
            href="/cadastro"
            className="
              group
              mx-auto
              mt-5
              flex
              min-h-[55px]
              w-full
              max-w-[350px]
              items-center
              justify-center
              gap-2.5
              rounded-full
              border
              border-white/5
              bg-gradient-to-r
              from-[#6D1F2F]
              to-[#C32F50]
              px-5
              text-[14px]
              font-black
              uppercase
              text-white
              shadow-[0_12px_35px_rgba(109,31,47,0.38)]
              transition-all
              duration-300
              ease-out

              hover:-translate-y-1
              hover:shadow-[0_18px_45px_rgba(109,31,47,0.50)]

              active:translate-y-0
              active:scale-[0.96]
              active:shadow-[0_7px_20px_rgba(109,31,47,0.35)]
            "
          >

            <Rocket
              size={19}
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

          {/* ==================================================
              MICRO BENEFÍCIOS
          ================================================== */}
          <div className="mt-4 flex items-center justify-center gap-3 text-[10px] text-zinc-400">

            <span
              className="
                flex
                items-center
                gap-1.5
                transition-colors
                duration-300
                hover:text-white
              "
            >
              <Check
                size={12}
                className="text-zinc-300"
              />

              Sem mensalidade
            </span>

            <span className="h-1 w-1 rounded-full bg-[#8F263D]" />

            <span
              className="
                flex
                items-center
                gap-1.5
                transition-colors
                duration-300
                hover:text-white
              "
            >
              <Check
                size={12}
                className="text-zinc-300"
              />

              Configure em poucos minutos
            </span>

          </div>

          {/* ==================================================
              DEMONSTRAÇÃO
          ================================================== */}
          <Link
            href="/fornadapizzaria"
            className="
              mx-auto
              mt-4
              block
              w-fit
              text-center
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