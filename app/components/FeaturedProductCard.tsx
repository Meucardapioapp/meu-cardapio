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

        min-w-[150px]
        max-w-[150px]

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
          h-[110px]
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

              text-[10px]
              md:text-[14px]

              font-extrabold

              px-2
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

      <div className="p-3 md:p-6">
        <h3
          className="
            text-[15px]
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
            mt-1

            text-[12px]
            md:text-[16px]

            text-zinc-500

            leading-4
            md:leading-6

            line-clamp-2

            min-h-[34px]
            md:min-h-[52px]
          "
        >
          {product.descricao}
        </p>

        <div className="mt-2 md:mt-5">
          {product.precoAntigo &&
            product.precoAntigo > product.preco && (
              <div
                className="
                  flex
                  items-center
                  gap-1
                  mb-1
                "
              >
                <span
                  className="
                    text-[11px]
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

                    text-[9px]
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
              text-[18px]
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
                  mt-1

                  text-[11px]
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