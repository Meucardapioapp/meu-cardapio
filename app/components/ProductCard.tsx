"use client"

import type { ProdutoFormatado } from "../types"

type Props = {
  product: ProdutoFormatado
  onAdd: () => void
}

export default function ProductCard({
  product,
  onAdd,
}: Props) {

  const lightMode =
    typeof window !== "undefined"
      ? localStorage.getItem(
          "cardapio-light-mode"
        ) === "true"
      : false

  const selectedColor =
    typeof window !== "undefined"
      ? localStorage.getItem(
          "cardapio-primary-color"
        ) || "#7F1D1D"
      : "#7F1D1D"

  const cardBg = lightMode
    ? "bg-white"
    : "bg-zinc-900"

  const borderColor = lightMode
    ? "border-[#DDD6CC]"
    : "border-zinc-800"

  const textPrimary = lightMode
    ? "text-zinc-900"
    : "text-white"

  const textSecondary = lightMode
    ? "text-zinc-500"
    : "text-zinc-400"

    const percentualDesconto =
  product.precoAntigo &&
  product.precoAntigo > product.preco
    ? Math.round(
        (
          (product.precoAntigo - product.preco) /
          product.precoAntigo
        ) * 100
      )
    : 0

  return (

    <div
      className={`
        ${cardBg}
        ${borderColor}
        border
        rounded-[32px]
        overflow-hidden
        transition-all
        hover:scale-[1.02]
      `}
    >

      <div className="relative h-72 overflow-hidden">
        {product.promocao && (
  <div
  className="
    absolute
    top-4
    left-4
    z-20
    bg-gradient-to-r
    from-red-500
    to-red-700
    text-white
    text-sm
    font-black
    px-4
    py-2
    rounded-full
    shadow-xl
    animate-pulse
  "
>
 {percentualDesconto}% OFF
</div>
)}

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
      bg-zinc-200
    "
  >
    Sem imagem
  </div>
)}

      </div>

      <div className="p-5">

        <h3
          className={`
            text-2xl
            font-black
            ${textPrimary}
          `}
        >
          {product.nome}
        </h3>

        <p
          className={`
            mt-2
            text-sm
            ${textSecondary}
          `}
        >
          {product.descricao}
        </p>

        <div className="
          flex
          items-center
          justify-between
          mt-6
        ">

          <div className="flex flex-col">

  {product.precoAntigo &&
    product.precoAntigo > product.preco && (

    <span
  className="
    text-base
    text-zinc-500
    line-through
    font-medium
  "
>
 R$ {product.precoAntigo.toLocaleString("pt-BR", {
  minimumFractionDigits: 2,
})}
</span>

  )}

 <span
  className="
    text-3xl
    font-black
  "
  style={{
    color: selectedColor,
  }}
>
 R$ {product.preco.toLocaleString("pt-BR", {
  minimumFractionDigits: 2,
})}
</span>

{product.precoAntigo &&
 product.precoAntigo > product.preco && (

  <span
    className="
      text-sm
      text-emerald-600
      font-bold
      mt-1
    "
  >
    Economize R$ {(product.precoAntigo - product.preco).toLocaleString(
  "pt-BR",
  {
    minimumFractionDigits: 2,
  }
)}
  </span>

)}

</div>

          <button
            onClick={onAdd}
            className="
              px-5
              py-3
              rounded-2xl
              font-bold
              text-white
              transition-all
              hover:scale-105
            "
            style={{
              backgroundColor:
                selectedColor,
            }}
          >
            Adicionar
          </button>

        </div>

      </div>

    </div>
  )
}