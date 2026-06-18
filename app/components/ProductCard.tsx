"use client"

import type { ProdutoFormatado } from "../types"

type Props = {
  product: ProdutoFormatado
  onAdd: () => void
  corPrincipal: string
}

export default function ProductCard({
  product,
  onAdd,
  corPrincipal,
}: Props) {

  const lightMode = true

const cardBg = "bg-white"

 const borderColor = "border-[#DDD6CC]"

const textPrimary = "text-zinc-900"

const textSecondary = "text-zinc-500"

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
        rounded-2xl
        overflow-hidden
        transition-all
        hover:scale-[1.02]
      `}
    >

      <div className="relative h-36 md:h-40 overflow-hidden">
        {product.promocao && (
 <div
  className="
    absolute
    top-4
    left-4
    z-20
    text-white
    text-xs
    font-black
    px-3
    py-1
    rounded-full
    shadow-xl
  "
  style={{
    backgroundColor: corPrincipal
  }}
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

      <div className="p-3">

        <h3
          className={`
            text-lg md:text-xl
            font-black
            ${textPrimary}
          `}
        >
          {product.nome}
        </h3>

        <p
  className={`
    mt-1
    text-xs md:text-sm
    line-clamp-1
    ${textSecondary}
  `}
>
          {product.descricao}
        </p>

        <div className="
          flex
          items-center
          justify-between
          mt-3
        ">

          <div className="flex flex-col">

  {product.precoAntigo &&
    product.precoAntigo > product.preco && (

    <span
  className="
    text-sm
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
    text-xl md:text-2xl
    font-black
  "
  style={{
  color: corPrincipal,
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
      text-xs
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
              px-3
py-2
rounded-lg
text-xs
              font-bold
              text-white
              transition-all
              hover:scale-105
            "
            style={{
  backgroundColor:
    corPrincipal,
}}
          >
            Adicionar
          </button>

        </div>

      </div>

    </div>
  )
}