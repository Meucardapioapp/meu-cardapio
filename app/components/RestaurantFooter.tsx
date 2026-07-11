"use client";

import { Rocket } from "lucide-react";

type Props = {
  corPrincipal: string;
};

export default function RestaurantFooter({
  corPrincipal,
}: Props) {
  return (
    <div className="mt-10 mb-20 md:mb-24">

      <div className="border-t border-zinc-200 pt-3 md:pt-4">

        <div className="max-w-5xl mx-auto px-4 md:px-6">

          {/* Cabeçalho */}

          <div className="text-center">

<p className="text-xs text-zinc-500">
  Desenvolvido por
</p>

<a
  href="https://meucardapioapp.com"
  target="_blank"
  rel="noopener noreferrer"
  className="mt-1 inline-block text-2xl md:text-3xl font-black transition-opacity hover:opacity-80"
  style={{ color: corPrincipal }}
>
  MeuCardápioApp
</a>

<p className="mt-2 text-sm text-zinc-500">
  Venda mais sem depender de aplicativos de delivery.
</p>

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



            </div>

          </div>

        </div>

      </div>

    </div>
  );
}