"use client";

import {
  CheckCircle2,
  Wallet,
  LayoutDashboard,
  ShoppingBag,
  Link2,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

const recursos = [
  {
    icon: CheckCircle2,
    titulo: "Crie sua conta",
    descricao: "Comece gratuitamente em poucos minutos.",
  },
  {
    icon: LayoutDashboard,
    titulo: "Painel completo",
    descricao: "Pedidos, vendas e clientes em um só lugar.",
  },
  {
    icon: ShoppingBag,
    titulo: "Cardápio profissional",
    descricao: "Feito para facilitar pedidos e vender mais.",
  },
  {
    icon: Link2,
    titulo: "Link personalizado",
    descricao: "Divulgue no WhatsApp, Instagram e Google.",
  },
  {
    icon: Wallet,
    titulo: "Economize mais",
    descricao: "Reduza sua dependência dos marketplaces.",
  },
  {
    icon: TrendingUp,
    titulo: "Venda mais",
    descricao: "Conquiste clientes e aumente seus resultados.",
  },
];

const beneficiosEconomia = [
  "Menos dinheiro perdido com taxas",
  "Mais margem para o seu restaurante",
  "Mais dinheiro para investir no negócio",
];

export default function FeaturesMobile() {
  return (
    <section className="relative overflow-hidden bg-[#F8F6F4] px-4 py-12">
      {/* EFEITOS DE FUNDO */}
      <div className="pointer-events-none absolute -right-32 top-20 h-72 w-72 rounded-full bg-[#C32F50]/[0.06] blur-[90px]" />
      <div className="pointer-events-none absolute -left-32 bottom-20 h-64 w-64 rounded-full bg-[#6D1F2F]/[0.05] blur-[90px]" />

      <div className="relative z-10 mx-auto w-full max-w-xl">
        {/* ========================================
            CABEÇALHO
        ======================================== */}

        <div className="text-center">
          <div
            className="
              mx-auto
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              border-[#6D1F2F]/15
              bg-white
              px-4
              py-2
              shadow-[0_4px_18px_rgba(40,15,20,0.05)]
            "
          >
            <Sparkles
              size={13}
              strokeWidth={2}
              className="text-[#C32F50]"
            />

            <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#6D1F2F]">
              Sua operação completa
            </span>
          </div>

          <h2
            className="
              mx-auto
              mt-4
              max-w-[320px]
              text-[27px]
              font-black
              leading-[1.05]
              tracking-[-0.045em]
              text-[#1D1114]
            "
          >
            Tudo que seu delivery
            <br />
            precisa para{" "}
            <span className="text-[#C32F50]">
              crescer
            </span>
          </h2>

          <p
            className="
              mx-auto
              mt-3
              max-w-[315px]
              text-[11px]
              leading-[1.65]
              text-zinc-500
            "
          >
            Do primeiro pedido à gestão do negócio.
            Tudo simples, profissional e no seu controle.
          </p>
        </div>

        {/* ========================================
            RECURSOS
        ======================================== */}

        <div className="mt-8 grid grid-cols-2 gap-3">
          {recursos.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.titulo}
                className="
                  group
                  relative
                  min-h-[138px]
                  overflow-hidden
                  rounded-[20px]
                  border
                  border-[#E8E0DD]
                  bg-white
                  p-4

                  shadow-[0_8px_30px_rgba(35,15,20,0.045)]

                  transition-all
                  duration-300
                  ease-out

                  hover:-translate-y-1
                  hover:border-[#C32F50]/30
                  hover:shadow-[0_14px_35px_rgba(109,31,47,0.10)]

                  active:scale-[0.97]
                  active:border-[#C32F50]/40
                "
              >
                {/* brilho do card */}
                <div
                  className="
                    pointer-events-none
                    absolute
                    -right-10
                    -top-10
                    h-24
                    w-24
                    rounded-full
                    bg-[#C32F50]/0
                    blur-2xl
                    transition-all
                    duration-500
                    group-hover:bg-[#C32F50]/10
                  "
                />

                <div className="relative z-10">
                  {/* ÍCONE */}

                  <div
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-[13px]

                      border
                      border-[#6D1F2F]/10
                      bg-[#6D1F2F]/[0.07]
                      text-[#8D263C]

                      transition-all
                      duration-300

                      group-hover:scale-110
                      group-hover:border-[#6D1F2F]
                      group-hover:bg-[#6D1F2F]
                      group-hover:text-white
                    "
                  >
                    <Icon size={18} strokeWidth={1.9} />
                  </div>

                  {/* TEXTO */}

                  <h3
                    className="
                      mt-3
                      text-[13px]
                      font-extrabold
                      leading-[1.2]
                      tracking-[-0.02em]
                      text-[#1D1114]
                    "
                  >
                    {item.titulo}
                  </h3>

                  <p
                    className="
                      mt-1.5
                      text-[10px]
                      leading-[1.5]
                      text-zinc-500
                    "
                  >
                    {item.descricao}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ========================================
            DESTAQUE ECONOMIA
        ======================================== */}

        <div
          className="
            group
            relative
            mt-5
            overflow-hidden
            rounded-[26px]
            border
            border-[#C32F50]/25

            bg-[#16070A]

            px-5
            pb-6
            pt-5

            shadow-[0_22px_55px_rgba(58,13,25,0.20)]

            transition-all
            duration-300

            hover:-translate-y-0.5
            hover:shadow-[0_26px_65px_rgba(58,13,25,0.27)]

            active:scale-[0.985]
          "
        >
          {/* LUZES */}

          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#C32F50]/35 blur-[75px]" />

          <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-[#6D1F2F]/30 blur-[70px]" />

          {/* detalhe superior */}

          <div className="pointer-events-none absolute left-5 right-5 top-0 h-px bg-gradient-to-r from-transparent via-[#E34366]/70 to-transparent" />

          <div className="relative z-10">
            {/* TAG */}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-white/10
                    bg-white/[0.07]
                    text-[#FF5B7C]
                  "
                >
                  <Wallet size={17} strokeWidth={1.9} />
                </div>

                <div>
                  <p className="text-[8px] font-bold uppercase tracking-[0.17em] text-white/45">
                    Economia real
                  </p>

                  <p className="mt-0.5 text-[10px] font-bold text-white">
                    Mais dinheiro no seu negócio
                  </p>
                </div>
              </div>

              <div
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-white/10
                  bg-white/[0.06]
                  text-white/60

                  transition-all
                  duration-300

                  group-hover:rotate-12
                  group-hover:bg-[#C32F50]
                  group-hover:text-white
                "
              >
                <ArrowUpRight size={15} />
              </div>
            </div>

            {/* VALOR */}

            <div className="mt-6">
              <p className="text-[11px] font-semibold text-white/60">
                Economize até
              </p>

              <div className="mt-1 flex items-end gap-1.5">
                <span
                  className="
                    text-[35px]
                    font-black
                    leading-none
                    tracking-[-0.055em]
                    text-white
                  "
                >
                  R$ 10.000
                </span>

                <span className="mb-1 text-[13px] font-bold text-[#FF5477]">
                  /mês
                </span>
              </div>

              <p
                className="
                  mt-3
                  max-w-[315px]
                  text-[10.5px]
                  leading-[1.6]
                  text-white/55
                "
              >
                Ao reduzir a dependência de marketplaces, seu delivery
                pode manter muito mais dinheiro dentro do próprio negócio.
              </p>
            </div>

            {/* LINHA */}

            <div className="my-5 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            {/* BENEFÍCIOS */}

            <div className="grid gap-2.5">
              {beneficiosEconomia.map((beneficio) => (
                <div
                  key={beneficio}
                  className="
                    flex
                    items-center
                    gap-2.5
                    rounded-xl
                    border
                    border-white/[0.06]
                    bg-white/[0.035]
                    px-3
                    py-2.5

                    transition-all
                    duration-300

                    hover:border-[#C32F50]/25
                    hover:bg-white/[0.06]

                    active:scale-[0.98]
                  "
                >
                  <div
                    className="
                      flex
                      h-5
                      w-5
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-[#C32F50]
                      text-white
                    "
                  >
                    <CheckCircle2 size={12} strokeWidth={2.3} />
                  </div>

                  <span className="text-[10px] font-medium text-white/75">
                    {beneficio}
                  </span>
                </div>
              ))}
            </div>

            {/* RODAPÉ */}

            <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-4">
              <div>
                <p className="text-[8px] uppercase tracking-[0.15em] text-white/35">
                  Resultado
                </p>

                <p className="mt-0.5 text-[11px] font-bold text-white">
                  Mais controle. Mais lucro.
                </p>
              </div>

              <TrendingUp
                size={20}
                strokeWidth={1.8}
                className="text-[#FF5477]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}