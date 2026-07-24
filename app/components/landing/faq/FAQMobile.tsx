"use client";

import { useState } from "react";
import {
  ChevronDown,
  CircleHelp,
  CreditCard,
  ShoppingBag,
  Wallet,
  Clock3,
  Share2,
  Store,
  Palette,
  BadgeDollarSign,
  MessageCircle,
  ArrowRight,
} from "lucide-react";

const perguntas = [
  {
    icon: BadgeDollarSign,
    pergunta: "Tem mensalidade?",
    resposta:
      "Não. Você pode criar seu cardápio gratuitamente e começar a vender em poucos minutos.",
  },
  {
    icon: CreditCard,
    pergunta: "Posso receber Pix e cartão?",
    resposta:
      "Sim. Você pode receber pagamentos online via Pix e cartão, além de disponibilizar pagamento na entrega.",
  },
  {
    icon: ShoppingBag,
    pergunta: "Como recebo os pedidos?",
    resposta:
      "Todos os pedidos chegam diretamente no painel do MeuCardapioApp em tempo real.",
  },
  {
    icon: Wallet,
    pergunta: "Quando recebo os pagamentos online?",
    resposta:
      "O saldo fica disponível no seu painel e, após solicitar o saque, o valor pode cair na sua conta em até 1 dia útil.",
  },
  {
    icon: Clock3,
    pergunta: "Quanto tempo leva para criar meu cardápio?",
    resposta:
      "Em poucos minutos você consegue cadastrar seu restaurante, adicionar seus produtos e começar a vender.",
  },
  {
    icon: Share2,
    pergunta: "Posso divulgar no WhatsApp?",
    resposta:
      "Sim. Você recebe um link exclusivo para compartilhar no WhatsApp, Instagram, Facebook e onde quiser.",
  },
  {
    icon: Store,
    pergunta: "Funciona para qualquer delivery?",
    resposta:
      "Sim. Hamburguerias, pizzarias, açaíterias, marmitarias, sushi, cafeterias, docerias e muitos outros tipos de delivery.",
  },
  {
    icon: Palette,
    pergunta: "Posso personalizar meu cardápio?",
    resposta:
      "Sim. Você pode personalizar cores, categorias, produtos, horários, taxas de entrega e muito mais.",
  },
];

export default function FAQMobile() {
  const [aberto, setAberto] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="
        relative
        overflow-hidden
        bg-[#F8F6F4]
        px-4
        py-12
      "
    >
      {/* =========================================
          EFEITOS DE FUNDO
      ========================================= */}

      <div
        className="
          pointer-events-none
          absolute
          -right-28
          top-20
          h-64
          w-64
          rounded-full
          bg-[#C32F50]/[0.05]
          blur-[90px]
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -left-28
          bottom-10
          h-56
          w-56
          rounded-full
          bg-[#6D1F2F]/[0.04]
          blur-[90px]
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
            <CircleHelp
              size={13}
              strokeWidth={2.2}
              className="text-[#C32F50]"
            />

            <span
              className="
                text-[9px]
                font-extrabold
                uppercase
                tracking-[0.18em]
                text-[#6D1F2F]
              "
            >
              Perguntas frequentes
            </span>
          </div>

          {/* TÍTULO */}

          <h2
            className="
              mx-auto
              mt-4
              max-w-[310px]
              text-[27px]
              font-black
              leading-[1.05]
              tracking-[-0.045em]
              text-[#1D1114]
            "
          >
            Ficou com alguma{" "}
            <span className="text-[#C32F50]">
              dúvida?
            </span>
          </h2>

          {/* DESCRIÇÃO */}

          <p
            className="
              mx-auto
              mt-3
              max-w-[300px]
              text-[11px]
              leading-[1.65]
              text-zinc-500
            "
          >
            Encontre aqui as respostas para as principais dúvidas
            sobre o MeuCardapioApp.
          </p>
        </div>

        {/* =========================================
            PERGUNTAS
        ========================================= */}

        <div className="mt-8 space-y-2.5">

          {perguntas.map((item, index) => {
            const Icon = item.icon;
            const estaAberto = aberto === index;

            return (
              <div
                key={item.pergunta}
                className={`
                  group
                  overflow-hidden
                  rounded-[18px]
                  border
                  bg-white
                  shadow-[0_5px_22px_rgba(35,15,20,0.035)]
                  transition-all
                  duration-300

                  ${
                    estaAberto
                      ? "border-[#6D1F2F]/25 shadow-[0_10px_30px_rgba(109,31,47,0.08)]"
                      : "border-[#E8E0DD] hover:border-[#6D1F2F]/20"
                  }
                `}
              >

                {/* PERGUNTA */}

                <button
                  type="button"
                  onClick={() =>
                    setAberto(estaAberto ? null : index)
                  }
                  className="
                    flex
                    w-full
                    items-center
                    gap-3
                    px-3.5
                    py-3.5
                    text-left
                    transition-all
                    duration-300
                    active:scale-[0.99]
                  "
                >

                  {/* ÍCONE */}

                  <div
                    className={`
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      border
                      transition-all
                      duration-300

                      ${
                        estaAberto
                          ? "border-[#6D1F2F] bg-[#6D1F2F] text-white"
                          : "border-[#6D1F2F]/10 bg-[#6D1F2F]/[0.06] text-[#8D263C]"
                      }
                    `}
                  >
                    <Icon
                      size={17}
                      strokeWidth={1.9}
                    />
                  </div>

                  {/* TEXTO */}

                  <span
                    className={`
                      flex-1
                      text-[12px]
                      font-extrabold
                      leading-[1.3]
                      tracking-[-0.015em]
                      transition-colors
                      duration-300

                      ${
                        estaAberto
                          ? "text-[#6D1F2F]"
                          : "text-[#1D1114]"
                      }
                    `}
                  >
                    {item.pergunta}
                  </span>

                  {/* SETA */}

                  <div
                    className={`
                      flex
                      h-7
                      w-7
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      transition-all
                      duration-300

                      ${
                        estaAberto
                          ? "rotate-180 bg-[#6D1F2F] text-white"
                          : "bg-[#F5F1EF] text-zinc-500"
                      }
                    `}
                  >
                    <ChevronDown
                      size={15}
                      strokeWidth={2}
                    />
                  </div>

                </button>

                {/* =========================================
                    RESPOSTA
                ========================================= */}

                <div
                  className={`
                    grid
                    transition-all
                    duration-300
                    ease-out

                    ${
                      estaAberto
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }
                  `}
                >
                  <div className="overflow-hidden">

                    <div className="px-3.5 pb-4">

                      <div
                        className="
                          ml-12
                          border-t
                          border-[#EEE8E5]
                          pt-3
                        "
                      >
                        <p
                          className="
                            max-w-[290px]
                            text-[10.5px]
                            leading-[1.65]
                            text-zinc-500
                          "
                        >
                          {item.resposta}
                        </p>
                      </div>

                    </div>

                  </div>
                </div>

              </div>
            );
          })}

        </div>

        {/* =========================================
            WHATSAPP
        ========================================= */}

        <div
          className="
            relative
            mt-6
            overflow-hidden
            rounded-[22px]
            border
            border-[#6D1F2F]/10
            bg-white
            px-5
            py-5
            text-center
            shadow-[0_8px_30px_rgba(35,15,20,0.05)]
          "
        >

          {/* EFEITO */}

          <div
            className="
              pointer-events-none
              absolute
              -right-10
              -top-10
              h-28
              w-28
              rounded-full
              bg-[#C32F50]/[0.07]
              blur-[35px]
            "
          />

          {/* ÍCONE */}

          <div
            className="
              relative
              mx-auto
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-[#6D1F2F]/[0.07]
              text-[#6D1F2F]
            "
          >
            <MessageCircle
              size={19}
              strokeWidth={2}
            />
          </div>

          {/* TEXTO */}

          <h3
            className="
              relative
              mt-3
              text-[14px]
              font-black
              tracking-[-0.02em]
              text-[#1D1114]
            "
          >
            Não encontrou o que procura?
          </h3>

          <p
            className="
              relative
              mx-auto
              mt-1
              max-w-[270px]
              text-[10.5px]
              leading-[1.6]
              text-zinc-500
            "
          >
            Fale com a nossa equipe pelo WhatsApp.
            Estamos prontos para ajudar.
          </p>

          {/* BOTÃO WHATSAPP */}

          <a
            href="https://wa.me/5592992338863?text=Ol%C3%A1%21%20Vim%20pelo%20site%20do%20MeuCardapioApp%20e%20preciso%20de%20ajuda."
            target="_blank"
            rel="noopener noreferrer"
            className="
              relative
              mx-auto
              mt-4
              flex
              h-11
              w-full
              max-w-[280px]
              items-center
              justify-center
              gap-2.5
              rounded-full

              bg-gradient-to-r
              from-[#6D1F2F]
              to-[#C32F50]

              px-5

              text-[11px]
              font-extrabold
              text-white

              shadow-[0_8px_25px_rgba(109,31,47,0.25)]

              transition-all
              duration-300

              hover:-translate-y-0.5
              hover:shadow-[0_12px_30px_rgba(109,31,47,0.32)]

              active:scale-[0.97]
            "
          >
            <MessageCircle
              size={16}
              strokeWidth={2}
            />

            <span>
              Falar pelo WhatsApp
            </span>

            <ArrowRight
              size={15}
              strokeWidth={2}
            />
          </a>

        </div>

      </div>
    </section>
  );
}