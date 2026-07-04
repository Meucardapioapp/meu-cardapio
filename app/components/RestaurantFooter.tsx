"use client";

import { Rocket } from "lucide-react";

type Props = {
  corPrincipal: string;
};

export default function RestaurantFooter({
  corPrincipal,
}: Props) {
  return (
    <div className="mt-0 mb-28">

      <div className="border-t border-zinc-200 pt-3">

        <div className="max-w-5xl mx-auto px-6">

          {/* Cabeçalho */}

          <div className="text-center">

            <p className="text-[14px] text-zinc-500">
              Site desenvolvido por
            </p>

            <h2
              className="mt-1 text-[32px] font-black tracking-tight"
              style={{
                color: corPrincipal,
              }}
            >
              MeuCardápioApp
            </h2>

            <p className="mt-2 text-[14px] text-zinc-500 leading-6">
              Venda mais sem depender de aplicativos de delivery.
            </p>

            <button
              onClick={() =>
                window.open(
                  "https://meucardapioapp.com",
                  "_blank"
                )
              }
              className="
                mt-5

                w-full
                max-w-[360px]
                h-12

                mx-auto

                rounded-full
                border-2

                flex
                items-center
                justify-center
                gap-3

                text-[18px]
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
              <Rocket size={20} />

              Crie o seu agora
            </button>

          </div>

          {/* Rodapé */}

          <div className="mt-7 border-t border-zinc-200 pt-4">

            <div className="text-center">

              <p className="text-[13px] text-zinc-500">
                © 2026 MeuCardápioApp. Todos os direitos reservados.
              </p>

              <p className="mt-1 text-[13px] text-zinc-500">
                CNPJ: 67.583.816/0001-66
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}