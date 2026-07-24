"use client";

import {
  Pizza,
  Beef,
  Soup,
  Sandwich,
  CakeSlice,
  CookingPot,
  Drumstick,
  Store,
} from "lucide-react";

const nichos = [
  {
    icon: Beef,
    label: "Hamburguerias",
    descricao: "Cardápios atrativos",
  },
  {
    icon: Pizza,
    label: "Pizzarias",
    descricao: "Mostre seus sabores",
  },
  {
    icon: Soup,
    label: "Açaíterias",
    descricao: "Divulgue seus combos",
  },
  {
    icon: Sandwich,
    label: "Lanchonetes",
    descricao: "Venda com facilidade",
  },
  {
    icon: CakeSlice,
    label: "Doces / Bolos",
    descricao: "Destaque seus produtos",
  },
  {
    icon: CookingPot,
    label: "Marmitarias",
    descricao: "Organize seus pedidos",
  },
  {
    icon: Drumstick,
    label: "Churrascarias",
    descricao: "Mais pedidos online",
  },
  {
    icon: Store,
    label: "E muito mais",
    descricao: "Qualquer delivery",
  },
];

export default function BenefitsMobile() {
  return (
    <section
      id="beneficios"
      className="
        relative
        overflow-hidden
        bg-[#16070A]
        px-4
        pb-10
        pt-7
        text-white
      "
    >
      {/* =========================================
          EFEITOS DE FUNDO
      ========================================= */}

      <div
        className="
          pointer-events-none
          absolute
          -right-24
          top-0
          h-[280px]
          w-[280px]
          rounded-full
          bg-[#6D1F2F]/25
          blur-[100px]
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -left-24
          bottom-0
          h-[240px]
          w-[240px]
          rounded-full
          bg-[#C32F50]/10
          blur-[100px]
        "
      />

      <div className="relative z-10 mx-auto w-full max-w-xl">

        {/* =========================================
            CABEÇALHO
        ========================================= */}

        <div className="text-center">

          {/* TAG */}
          <div
            className="
              mx-auto
              inline-flex
              items-center
              rounded-full
              border
              border-[#8F263D]
              bg-[#6D1F2F]/10
              px-4
              py-1.5
              text-[9px]
              font-bold
              uppercase
              tracking-[0.18em]
              text-zinc-200
            "
          >
            Para todos os negócios
          </div>

          {/* TÍTULO */}
          <h2
            className="
              mt-4
              text-[27px]
              font-black
              leading-[1.05]
              tracking-[-0.04em]
              text-white
            "
          >
            Cardápio ideal para
            <br />

            <span className="text-[#C32F50]">
              qualquer delivery
            </span>
          </h2>

          {/* DESCRIÇÃO */}
          <p
            className="
              mx-auto
              mt-3
              max-w-[330px]
              text-[9px]
              leading-[1.6]
              text-zinc-400
            "
          >
            Perfeito para qualquer negócio que vende por delivery.
          </p>
        </div>

        {/* =========================================
            GRID DOS NEGÓCIOS
        ========================================= */}

        <div className="mt-7 grid grid-cols-4 gap-2">

          {nichos.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="
                  group
                  relative
                  overflow-hidden

                  rounded-[20px]
                  border
                  border-white/[0.08]

                  bg-white/[0.035]

                  px-1
                  py-3

                  text-center

                  shadow-[0_10px_35px_rgba(0,0,0,0.18)]

                  backdrop-blur-sm

                  transition-all
                  duration-300
                  ease-out

                  hover:-translate-y-1
                  hover:border-[#C32F50]/70
                  hover:bg-[#6D1F2F]/15
                  hover:shadow-[0_15px_40px_rgba(109,31,47,0.25)]

                  active:scale-[0.96]
                  active:border-[#C32F50]
                  active:bg-[#6D1F2F]/25
                "
              >

                {/* BRILHO AO PASSAR / TOCAR */}
                <div
                  className="
                    pointer-events-none
                    absolute
                    inset-0
                    opacity-0

                    bg-gradient-to-br
                    from-[#C32F50]/15
                    via-transparent
                    to-transparent

                    transition-opacity
                    duration-300

                    group-hover:opacity-100
                  "
                />

                {/* ÍCONE */}
                <div
                  className="
                    relative
                    mx-auto

                    flex
                    h-12
                    w-12
                    items-center
                    justify-center

                    rounded-full

                    border
                    border-[#8F263D]/70

                    bg-[#6D1F2F]/25

                    text-[#E64A6B]

                    shadow-[0_8px_25px_rgba(109,31,47,0.18)]

                    transition-all
                    duration-300

                    group-hover:scale-110
                    group-hover:border-[#C32F50]
                    group-hover:bg-[#6D1F2F]
                    group-hover:text-white

                    group-active:scale-95
                  "
                >
                  <Icon
                    size={21}
                    strokeWidth={1.8}
                  />
                </div>

                {/* NOME */}
                <p
                  className="
                    relative
                    mt-3
                    text-[9px]
                    font-extrabold
                    leading-tight
                    text-white

                    transition-colors
                    duration-300

                    group-hover:text-[#F05A79]
                  "
                >
                  {item.label}
                </p>

                {/* DESCRIÇÃO */}
                <p
                  className="
                    relative
                    mt-1
                    text-[8px]
                    leading-[1.35]
                    text-zinc-500

                    transition-colors
                    duration-300

                    group-hover:text-zinc-300
                  "
                >
                  {item.descricao}
                </p>
              </div>
            );
          })}

        </div>

        {/* =========================================
            PARTE INFERIOR
        ========================================= */}

        <div
          className="
            mt-5
            rounded-[18px]
            border
            border-[#6D1F2F]/30
            bg-[#6D1F2F]/10
            px-4
            py-3
            text-center
          "
        >
          <p className="text-[11px] font-semibold text-zinc-300">
            E qualquer outro tipo de empresa de delivery!
          </p>

          <p className="mt-1 text-[9px] text-zinc-500">
            Um cardápio profissional para qualquer segmento.
          </p>
        </div>

      </div>
    </section>
  );
}