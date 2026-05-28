"use client"

import type { CartItem } from "../types"

type Props = {
  cart: CartItem[]
  openCart?: () => void
}

export default function Header({
  cart,
  openCart,
}: Props) {

  const totalItems = cart.reduce(
    (acc, item) => acc + item.quantity,
    0
  )

  return (
    <header className="border-b border-zinc-900 bg-black sticky top-0 z-50">

      <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">

        <h1 className="text-2xl font-bold text-white">
          MeuCardapioApp
        </h1>

        <button
          onClick={() => {

            if (openCart) {
              openCart()
              return
            }

            const carrinho =
              document.getElementById("cart-section")

            carrinho?.scrollIntoView({
              behavior: "smooth",
            })
          }}
          className="bg-red-500 hover:bg-red-400 transition px-5 py-2 rounded-xl text-white font-bold"
        >

          Carrinho ({totalItems})

        </button>

      </div>

    </header>
  )
}