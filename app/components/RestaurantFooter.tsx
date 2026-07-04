"use client";

import { Rocket } from "lucide-react";

type Props = {
  corPrincipal: string;
};

export default function RestaurantFooter({
  corPrincipal,
}: Props) {
  return (
    <div className="mt-0 mb-24 md:mb-28">

      <div className="border-t border-zinc-200 pt-3 md:pt-4">

        <div className="max-w-5xl mx-auto px-4 md:px-6">

          {/* Cabeçalho */}

          <div className="text-center">

            <p
              className="
                text-[12px]
                md:text-[14px]
                text-zinc-500
              "
            >
              Site desenvolvido por
            </p>

            <h2
              className="
                mt-1

                text-[24px]
                md:text-[32px]

                font-black

                tracking-tight
              "
              style={{
                color: corPrincipal,
              }}
            >
              MeuCardápioApp
            </h2>

            <p
              className="
                mt-2

                text-[12px]
                md:text-[14px]

                text-zinc-500

                leading-5
                md:leading-6
              "
            >
              Venda mais sem depender de aplicativos de
              delivery.
            </p>

            <button
              onClick={() =>
                window.open(
                  "https://meucardapioapp.com",
                  "_blank"
                )
              }
              className="
                mt-4
                md:mt-5

                w-full
                max-w-[320px]
                md:max-w-[360px]

                h-11
                md:h-12

                mx-auto

                rounded-full

                border-2

                flex
                items-center
                justify-center
                gap-2
                md:gap-3

                text-[15px]
                md:text-[18px]

                font-bold

                transition-all
                duration-300

                hover:scale-[1.02]
                active:scale-[0.98]
              "
              style={{
                borderColor: corPrincipal,
                color: corPrincipal,
              }}
            >
              <Rocket size={18} />

              Crie o seu agora
            </button>

          </div>

          {/* Rodapé */}

          <div
            className="
              mt-6
              md:mt-7

              border-t
              border-zinc-200

              pt-4
            "
          >
            <div className="text-center">

              <p
                className="
                  text-[11px]
                  md:text-[13px]

                  text-zinc-500

                  leading-5
                "
              >
                © 2026 MeuCardápioApp.
                <br className="md:hidden" />
                <span className="hidden md:inline"> </span>
                Todos os direitos reservados.
              </p>

              <p
                className="
                  mt-1

                  text-[11px]
                  md:text-[13px]

                  text-zinc-500
                "
              >
                CNPJ: 67.583.816/0001-66
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}