"use client";

import type { ProdutoFormatado } from "../types";

type Props = {
  product: ProdutoFormatado;
  onAdd: () => void;
  corPrincipal: string;
  variant?: "list" | "grid";
};

export default function ProductCard({
  product,
  onAdd,
  corPrincipal,
  variant = "list",
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

    <div
  className="
    relative
    bg-white
    rounded-[30px]
    border
    border-[#ECE8E2]
    shadow-[0_6px_20px_rgba(0,0,0,0.06)]
    px-6
    py-5
    flex
    items-center
    justify-between
    gap-6
    transition-all
    duration-300
    hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)]
  "
>

      {/* Texto */}

 <div
  className="
    flex
    flex-col
    justify-between
    min-w-0
    flex-1
    min-h-[150px]
  "
>

        <h3
          className="
            text-[24px]
            font-extrabold
            text-zinc-900
            leading-tight
          "
        >
          {product.nome}
        </h3>

        <p
          className="
            mt-3
            text-[17px]
            leading-7
            text-zinc-500
            line-clamp-3
          "
        >
          {product.descricao}
        </p>

        <div className="mt-auto pt-4">

{product.precoAntigo &&
  product.precoAntigo > product.preco && (
    <div
      className="
        flex
        items-center
        gap-2
        mb-1
      "
    >
      <span
        className="
          text-[15px]
          text-zinc-400
          line-through
        "
      >
        R${" "}
        {product.precoAntigo.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
        })}
      </span>

<span
  className="
    bg-red-600
    text-white
    text-[14px]
    font-extrabold
    px-3
    py-1
    rounded-full
    leading-none
    shadow-md
  "
>
   - {percentualDesconto}%
</span>
    </div>
  )}

          <p
            className="
              text-[30px]
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
    text-[17px]
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

      {/* Imagem */}

      <div
        className="
          relative
          shrink-0 mr-3
        "
      >
        <div
          className="
            w-[200px]
            h-[200px]
            rounded-[22px]
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
        </div>

        <button
          onClick={onAdd}
          className="
            absolute
            -right-2
            bottom-0
            w-14
            h-14
            rounded-full
            text-white
            text-3xl
            shadow-xl
            transition-all
            hover:scale-105
          "
          style={{
            backgroundColor: corPrincipal,
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}