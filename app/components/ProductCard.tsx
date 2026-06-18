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

      <div className="relative h-28 md:h-40 overflow-hidden">
        {product.promocao && (
 <div
  className="
    absolute
    top-2
    left-2
    z-20
    text-white
    text-[11px]
    font-black
    px-2
    py-0.5
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

      <div className="p-2.5">

        <h3
          className={`
            text-base md:text-xl
            font-black
            ${textPrimary}
          `}
        >
          {product.nome}
        </h3>

        <p
  className={`
    mt-1
    text-[11px] md:text-sm
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
          mt-2
        ">

          <div className="flex flex-col min-w-0">

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
    text-lg
    md:text-2xl
    font-black
    whitespace-nowrap
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
      text-[11px]
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
              px-2
py-1
rounded-lg
text-[10px]
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