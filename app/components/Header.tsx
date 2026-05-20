type HeaderProps = {
  cart: number
}

export default function Header({ cart }: HeaderProps) {
  return (
    <header className="flex items-center justify-between mb-10">
      <div>
        <h1 className="text-5xl font-bold text-white">
          Loja Delivery
        </h1>

        <p className="text-zinc-400 mt-2">
          Os melhores lanches da cidade 🍔
        </p>
      </div>

      <button className="bg-green-500 hover:bg-green-600 transition px-6 py-3 rounded-2xl font-bold text-black">
        🛒 {cart}
      </button>
    </header>
  )
}