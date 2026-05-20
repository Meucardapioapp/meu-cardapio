type ProductCardProps = {
  product: {
    id: string
    name: string
    description: string
    price: number
    image: string
  }
  onAdd: () => void
}

export default function ProductCard({
  product,
  onAdd,
}: ProductCardProps) {

  return (

    <div className="bg-black border border-zinc-800 rounded-2xl overflow-hidden hover:border-green-500 transition-all duration-300">

      <div className="relative">

        <img
          src={product.image}
          alt={product.name}
          className="w-full h-32 md:h-44 object-cover"
        />

      </div>

      <div className="p-2 md:p-3">

        <h3 className="font-bold text-sm md:text-lg leading-tight line-clamp-1">
          {product.name}
        </h3>

        <p className="text-zinc-400 text-xs md:text-sm mt-1 line-clamp-2 min-h-[32px] md:min-h-[40px]">
          {product.description}
        </p>

        <div className="flex items-center justify-between mt-3">

          <span className="text-green-400 font-bold text-lg md:text-2xl">
            R$ {product.price.toFixed(2)}
          </span>

          <button
            onClick={onAdd}
            className="w-10 h-10 rounded-xl bg-green-500 hover:bg-green-400 transition flex items-center justify-center text-xl font-bold"
          >
            +
          </button>

        </div>

      </div>

    </div>
  )
}