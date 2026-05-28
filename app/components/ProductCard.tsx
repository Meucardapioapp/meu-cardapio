"use client"

type Product = {
  id: number
  name: string
  description: string
  price: number
  image: string
}

type Props = {
  product: Product
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

  return (

    <div
      className={`
        ${cardBg}
        ${borderColor}
        border
        rounded-3xl
        overflow-hidden
        transition-all
        hover:scale-[1.02]
      `}
    >

      <div className="relative h-56 overflow-hidden">

        <img
          src={product.image}
          alt={product.name}
          className="
            w-full
            h-full
            object-cover
          "
        />

      </div>

      <div className="p-5">

        <h3
          className={`
            text-xl
            font-black
            ${textPrimary}
          `}
        >
          {product.name}
        </h3>

        <p
          className={`
            mt-2
            text-sm
            ${textSecondary}
          `}
        >
          {product.description}
        </p>

        <div className="
          flex
          items-center
          justify-between
          mt-6
        ">

          <span
            className="
              text-3xl
              font-black
            "
            style={{
              color: selectedColor,
            }}
          >
            R$ {product.price}
          </span>

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