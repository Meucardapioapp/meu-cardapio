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
  const preco = Number(product.preco) || 0;
  const precoAntigo = Number(product.precoAntigo) || 0;

  const temDescricao =
    Boolean(product.descricao) &&
    String(product.descricao).trim() !== "" &&
    String(product.descricao).trim() !== "0";

  const temPreco = preco > 0;

  const temPromocao =
    precoAntigo > 0 &&
    preco > 0 &&
    precoAntigo > preco;

  const percentualDesconto = temPromocao
    ? Math.round(
        ((precoAntigo - preco) / precoAntigo) * 100
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

        h-[248px]
        md:h-[430px]

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

        {/* DESCONTO SOBRE A FOTO */}

        {temPromocao && (
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

      <div
        className="
          p-2.5
          md:p-5
        "
      >
        {/* NOME */}

        <h3
          className="
            text-[14px]
            md:text-[20px]

            font-semibold
            text-zinc-900

            leading-tight
            line-clamp-1
          "
        >
          {product.nome}
        </h3>

        {/* ÁREA FIXA DA DESCRIÇÃO */}

        <div
          className="
            h-[34px]
            md:h-[52px]

            mt-1
          "
        >
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
  {temDescricao ? product.descricao : "\u00A0"}
</p>
        </div>

        {/* ÁREA DOS PREÇOS */}

        <div className="mt-2 md:mt-5">
          {/* LINHA DO PREÇO ANTIGO */}

          <div
            className="
              h-[17px]
              md:h-[24px]

              flex
              items-center
            "
          >
            {temPromocao && (
              <div
                className="
                  flex
                  items-center
                  gap-1
                "
              >
                <span
                  className="
                    text-[12px]
                    md:text-[16px]

                    text-zinc-400
                    line-through
                  "
                >
                  R${" "}
                  {precoAntigo.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
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
          </div>

          {/* PREÇO ATUAL */}

          <div
            className="
              h-[22px]
              md:h-[36px]

              flex
              items-center
            "
          >
            {temPreco && (
              <p
                className="
                  text-[16px]
                  md:text-[30px]

                  font-bold
                  leading-none
                "
                style={{
                  color: corPrincipal,
                }}
              >
                R${" "}
                {preco.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
            )}
          </div>

          {/* ECONOMIA */}

          <div
            className="
              h-[18px]
              md:h-[25px]

              flex
              items-center
            "
          >
            {temPromocao && (
              <p
                className="
                  text-[11px]
                  md:text-[16px]

                  font-semibold
                  text-emerald-600
                "
              >
                Economize R${" "}
                {(precoAntigo - preco).toLocaleString(
                  "pt-BR",
                  {
                    minimumFractionDigits: 2,
                  }
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}