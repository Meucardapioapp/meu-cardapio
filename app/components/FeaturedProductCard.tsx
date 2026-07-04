"use client";

import type { ProdutoFormatado } from "../types";

type Props = {
  product: ProdutoFormatado;
  onClick: () => void;
  corPrincipal: string;
};

export default function FeaturedProductCard({
  product,
  onClick,
  corPrincipal,
}: Props) {
  const percentualDesconto =
    product.precoAntigo &&
    product.precoAntigo > product.preco
      ? Math.round(
          ((product.precoAntigo - product.preco) /
            product.precoAntigo) *
            100
        )
      : 0;

  return (
    <button
      onClick={onClick}
      className="
        flex-none

        min-w-[185px]
        max-w-[185px]

        md:min-w-[270px]
        md:max-w-[270px]

        bg-white
        rounded-[24px]
        overflow-hidden

        border
        border-[#ECE8E2]

        shadow-sm
        hover:shadow-lg
        hover:-translate-y-1

        transition-all
        duration-300

        text-left
        snap-start
      "
    >
      {/* FOTO */}

      <div
        className="
          relative
          h-[135px]
          md:h-[210px]
          overflow-hidden
          bg-zinc-100
        "
      >
        {product.imagem ? (
          <img
            src={product.imagem}
            alt={product.nome}
            className="
              w-full
              h-full
              object-cover
              transition-transform
              duration-300
              hover:scale-105
            "
          />
        ) : (
          <div
            className="
              w-full
              h-full
              flex
              items-center
              justify-center
              text-zinc-400
            "
          >
            Sem imagem
          </div>
        )}

        {percentualDesconto > 0 && (
          <div
            className="
              absolute
              top-2
              left-2

              text-white

              text-[11px]
              md:text-[14px]

              font-extrabold

              px-3
              md:px-4

              py-[3px]
              md:py-[5px]

              rounded-full

              shadow-md
            "
            style={{
              backgroundColor: corPrincipal,
            }}
          >
            {percentualDesconto}% OFF
          </div>
        )}
      </div>

      {/* CONTEÚDO */}

      <div className="p-4 md:p-6">
        <h3
          className="
            text-[17px]
            md:text-[22px]

            font-black

            text-zinc-900

            leading-tight

            line-clamp-1
          "
        >
          {product.nome}
        </h3>

        <p
          className="
            mt-2

            text-[13px]
            md:text-[16px]

            text-zinc-500

            leading-5
            md:leading-6

            line-clamp-2

            min-h-[42px]
            md:min-h-[52px]
          "
        >
          {product.descricao}
        </p>

        <div className="mt-3 md:mt-5">
          {product.precoAntigo &&
            product.precoAntigo > product.preco && (
              <div
                className="
                  flex
                  items-center
                  gap-2
                  mb-2
                "
              >
                <span
                  className="
                    text-[12px]
                    md:text-[15px]

                    text-zinc-400

                    line-through
                  "
                >
                  R${" "}
                  {product.precoAntigo.toLocaleString(
                    "pt-BR",
                    {
                      minimumFractionDigits: 2,
                    }
                  )}
                </span>

                <span
                  className="
                    text-white

                    text-[10px]
                    md:text-[12px]

                    font-bold

                    px-2

                    py-[1px]
                    md:py-[2px]

                    rounded-full
                  "
                  style={{
                    backgroundColor: corPrincipal,
                  }}
                >
                  -{percentualDesconto}%
                </span>
              </div>
            )}

          <p
            className="
              text-[26px]
              md:text-[34px]

              font-black

              leading-none
            "
            style={{
              color: corPrincipal,
            }}
          >
            R${" "}
            {product.preco.toLocaleString(
              "pt-BR",
              {
                minimumFractionDigits: 2,
              }
            )}
          </p>

          {product.precoAntigo &&
            product.precoAntigo > product.preco && (
              <p
                className="
                  mt-2

                  text-[13px]
                  md:text-[16px]

                  font-semibold

                  text-emerald-600
                "
              >
                Economize R${" "}
                {(
                  product.precoAntigo -
                  product.preco
                ).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
            )}
        </div>
      </div>
    </button>
  );
}