interface Props {
  cart: any[]
  setOpenCart: any
}

export default function Header({
  cart,
  setOpenCart,
}: Props) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-50">

      <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">

        <h1 className="text-2xl font-bold text-white">
          MeuCardapioApp
        </h1>

        <button
          onClick={() =>
            setOpenCart(true)
          }
          className="bg-red-500 px-5 py-2 rounded-2xl font-bold"
        >
          Carrinho (
          {cart.length})
        </button>

      </div>

    </header>
  )
}