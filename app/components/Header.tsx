"use client"

import { ShoppingCart } from "lucide-react"
import { getThemeSettings } from "../lib/theme"
import type { CartItem } from "../types"

type Props = {
  cart: CartItem[]
  openCart?: () => void
  logo?: string
  corPrincipal?: string
}

export default function Header({
  cart,
  openCart,
  logo,
  corPrincipal,
}: Props) {
  const totalItems = cart.reduce(
    (acc, item) => acc + item.quantity,
    0
  )

  const {
    lightMode,
    selectedColor,
  } = getThemeSettings()

  const bgColor = lightMode
    ? "bg-[#F4F1EA]"
    : "bg-zinc-950"

  const borderColor = lightMode
    ? "border-[#DDD6CC]"
    : "border-zinc-800"

  const textColor = lightMode
    ? "text-zinc-700"
    : "text-zinc-300"

  return (
    <header
      className={`
        ${bgColor}
        ${borderColor}
        border-b
        sticky
        top-0
        z-50
        backdrop-blur-md
      `}
    >
      <div
        className="
          max-w-7xl
          mx-auto
          px-5
          h-20
          flex
          items-center
          justify-between
        "
      >
        <div
          className="
            w-12
            h-12
            rounded-full
            overflow-hidden
            border
            border-[#DDD6CC]
            bg-white
            flex
            items-center
            justify-center
            shrink-0
          "
        >
          {logo ? (
            <img
              src={logo}
              alt="Logo"
              className="
                w-full
                h-full
                object-cover
              "
            />
          ) : (
            <span className="font-semibold">
              Logo
            </span>
          )}
        </div>

       <nav
  className={`
    hidden
    md:flex
    items-center
    gap-10
    font-medium
    ${textColor}
  `}
>
  <button>
    Início
  </button>

  <button
    className="
      border-b-2
      pb-1
      font-semibold
    "
    style={{
      color: corPrincipal || selectedColor,
borderColor: corPrincipal || selectedColor,
    }}
  >
    Cardápio
  </button>
</nav>

        <button
          onClick={() => {
            if (openCart) {
              openCart()
              return
            }

            const carrinho =
              document.getElementById(
                "cart-section"
              )

            carrinho?.scrollIntoView({
              behavior: "smooth",
            })
          }}
          className="
            transition-all
            px-5
            py-3
            rounded-xl
            text-white
            font-semibold
            hover:scale-105
          "
          style={{
            backgroundColor:
              corPrincipal || selectedColor
          }}
        >
  <div className="flex items-center gap-3">
    <ShoppingCart
  size={22}
  strokeWidth={1.8}
/>
   <span>
  Carrinho ({totalItems})
</span>
  </div>
</button>
</div>
</header>
  )
}