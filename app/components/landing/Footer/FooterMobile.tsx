"use client";

import Link from "next/link";

import {
  ArrowRight,
  Mail,
  MessageCircle,
  Gift,
  BarChart3,
  CircleHelp,
  UserPlus,
  LogIn,
  Sparkles,
} from "lucide-react";

const linksFooter = [
  {
    icon: Gift,
    label: "Benefícios",
    href: "#beneficios",
  },
  {
    icon: BarChart3,
    label: "Dashboard",
    href: "#dashboard",
  },
  {
    icon: CircleHelp,
    label: "FAQ",
    href: "#faq",
  },
  {
    icon: UserPlus,
    label: "Criar conta",
    href: "/cadastro",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    href: "https://wa.me/5592992338863",
    externo: true,
  },
  {
    icon: Mail,
    label: "E-mail",
    href: "mailto:contatomeucardapio@gmail.com",
    externo: true,
  },
];

export default function FooterMobile() {
  return (
    <footer
      className="
        relative
        overflow-hidden
        bg-[#16070A]
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
          -right-20
          top-0
          h-52
          w-52
          rounded-full
          bg-[#C32F50]/10
          blur-[90px]
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -left-24
          bottom-0
          h-52
          w-52
          rounded-full
          bg-[#6D1F2F]/10
          blur-[90px]
        "
      />

      <div
        className="
          relative
          z-10
          mx-auto
          w-full
          max-w-xl
          px-4
          pb-6
          pt-5
        "
      >

        {/* =========================================
            CTA COMPACTO
        ========================================= */}

        <div
          className="
            relative
            overflow-hidden
            rounded-[18px]

            border
            border-white/[0.07]

            bg-gradient-to-br
            from-[#2A0C12]
            via-[#23090E]
            to-[#190609]

            px-4
            py-4

            shadow-[0_12px_35px_rgba(0,0,0,0.25)]
          "
        >

          {/* brilho discreto */}

          <div
            className="
              pointer-events-none
              absolute
              -right-12
              -top-14
              h-36
              w-36
              rounded-full
              bg-[#C32F50]/15
              blur-[55px]
            "
          />

          {/* TAG */}

          <div
            className="
              relative
              inline-flex
              items-center
              gap-1.5

              rounded-full
              border
              border-[#C32F50]/20

              bg-[#6D1F2F]/15

              px-2.5
              py-1
            "
          >
            <Sparkles
              size={9}
              className="text-[#D94B68]"
            />

            <span
              className="
                text-[7px]
                font-extrabold
                uppercase
                tracking-[0.16em]
                text-white/55
              "
            >
              Comece agora
            </span>
          </div>

          {/* CONTEÚDO */}

          <div
            className="
              relative
              mt-3
              flex
              items-end
              justify-between
              gap-4
            "
          >

            <div className="min-w-0">

              <h2
                className="
                  max-w-[190px]
                  text-[17px]
                  font-black
                  leading-[1.08]
                  tracking-[-0.035em]
                  text-white
                "
              >
                Seu delivery merece
                <span className="text-[#D63A5C]">
                  {" "}vender mais.
                </span>
              </h2>

              <p
                className="
                  mt-2
                  max-w-[190px]
                  text-[8.5px]
                  leading-[1.55]
                  text-white/45
                "
              >
                Crie seu cardápio profissional e comece gratuitamente.
              </p>

            </div>

            {/* BOTÃO */}

            <Link
              href="/cadastro"
              aria-label="Criar meu cardápio"
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center

                rounded-full

                bg-[#C32F50]
                text-white

                shadow-[0_8px_20px_rgba(195,47,80,0.25)]

                transition-all
                duration-300

                hover:scale-105
                hover:bg-[#D63A5C]

                active:scale-95
              "
            >
              <ArrowRight
                size={16}
                strokeWidth={2.2}
              />
            </Link>

          </div>

        </div>

        {/* =========================================
            MARCA
        ========================================= */}

        <div
          className="
            mt-5
            flex
            items-center
            justify-between
          "
        >

          <div className="flex items-center gap-2.5">

            <div
              className="
                flex
                h-8
                w-8
                items-center
                justify-center

                rounded-lg

                border
                border-[#C32F50]/25

                bg-[#6D1F2F]/20

                text-[14px]
                font-black
                text-white
              "
            >
              M
            </div>

            <div>

              <h3
                className="
                  text-[14px]
                  font-black
                  leading-none
                  tracking-[-0.035em]
                "
              >
                <span className="text-white">
                  MeuCardapio
                </span>

                <span className="text-[#C32F50]">
                  App
                </span>
              </h3>

              <p
                className="
                  mt-1
                  text-[8px]
                  text-white/30
                "
              >
                Seu delivery. Sua marca. Seus clientes.
              </p>

            </div>

          </div>

          {/* ENTRAR */}

          <Link
            href="/login"
            className="
              flex
              items-center
              gap-1.5

              rounded-full

              border
              border-white/[0.08]

              bg-white/[0.03]

              px-3
              py-1.5

              text-[8px]
              font-bold
              text-white/55

              transition

              hover:bg-white/[0.06]
              hover:text-white
            "
          >
            <LogIn size={10} />

            Entrar
          </Link>

        </div>

        {/* DIVISÓRIA */}

        <div
          className="
            my-5
            h-px
            bg-gradient-to-r
            from-transparent
            via-white/[0.08]
            to-transparent
          "
        />

        {/* =========================================
            LINKS 3 COLUNAS / 2 LINHAS
        ========================================= */}

        <div className="grid grid-cols-3 gap-2">

          {linksFooter.map((item) => {
            const Icon = item.icon;

            const conteudo = (
              <>
                <div
                  className="
                    flex
                    h-7
                    w-7
                    items-center
                    justify-center

                    rounded-lg

                    border
                    border-white/[0.05]

                    bg-white/[0.04]

                    text-[#D94B68]

                    transition-all
                    duration-300

                    group-hover:border-[#C32F50]/20
                    group-hover:bg-[#6D1F2F]/15
                  "
                >
                  <Icon size={12} />
                </div>

                <span
                  className="
                    text-[8.5px]
                    font-semibold
                    text-white/55

                    transition
                    group-hover:text-white/85
                  "
                >
                  {item.label}
                </span>
              </>
            );

            if (item.externo) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target={
                    item.href.startsWith("https")
                      ? "_blank"
                      : undefined
                  }
                  rel={
                    item.href.startsWith("https")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="
                    group
                    flex
                    h-[58px]
                    items-center
                    gap-2

                    rounded-xl

                    border
                    border-white/[0.04]

                    bg-white/[0.015]

                    px-2

                    transition-all
                    duration-300

                    hover:border-white/[0.08]
                    hover:bg-white/[0.04]

                    active:scale-[0.97]
                  "
                >
                  {conteudo}
                </a>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className="
                  group
                  flex
                  h-[58px]
                  items-center
                  gap-2

                  rounded-xl

                  border
                  border-white/[0.04]

                  bg-white/[0.015]

                  px-2

                  transition-all
                  duration-300

                  hover:border-white/[0.08]
                  hover:bg-white/[0.04]

                  active:scale-[0.97]
                "
              >
                {conteudo}
              </Link>
            );
          })}

        </div>

        {/* =========================================
            RODAPÉ LEGAL
        ========================================= */}

        <div
          className="
            my-5
            h-px
            bg-gradient-to-r
            from-transparent
            via-white/[0.08]
            to-transparent
          "
        />

        <div
          className="
            flex
            items-center
            justify-center
            gap-3

            text-[7.5px]
            font-medium
            text-white/25
          "
        >
          <Link
            href="/privacidade"
            className="transition hover:text-white/60"
          >
            Privacidade
          </Link>

          <span className="h-0.5 w-0.5 rounded-full bg-white/15" />

          <Link
            href="/termos"
            className="transition hover:text-white/60"
          >
            Termos
          </Link>

          <span className="h-0.5 w-0.5 rounded-full bg-white/15" />

          <Link
            href="/cookies"
            className="transition hover:text-white/60"
          >
            Cookies
          </Link>
        </div>

        <p
          className="
            mt-3
            text-center
            text-[7.5px]
            text-white/20
          "
        >
          © 2026{" "}

          <strong className="font-semibold text-white/35">
            MeuCardapioApp
          </strong>

          . Todos os direitos reservados.
        </p>

      </div>
    </footer>
  );
}