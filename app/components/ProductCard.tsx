type ProductProps = {
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
}: ProductProps) {

  return (

    <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden hover:border-green-500 transition-all">

      <img
        src={product.image}
        alt={product.name}
        className="w-full h-40 object-cover"
      />

      <div className="p-4">

        <h3 className="text-lg font-bold">
          {product.name}
        </h3>

        <p className="text-zinc-400 text-sm mt-2 min-h-[40px]">
          {product.description}
        </p>

        <div className="flex items-center justify-between mt-4">

          <span className="text-green-400 text-2xl font-bold">
            R$ {Number(product.price).toFixed(2)}
          </span>

          <button
            onClick={onAdd}
            className="bg-green-500 hover:bg-green-400 transition px-4 py-2 rounded-xl font-bold"
          >
            Adicionar
          </button>

        </div>

      </div>

    </div>
  )
}