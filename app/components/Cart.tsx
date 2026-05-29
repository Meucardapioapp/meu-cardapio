"use client"

import { getThemeSettings } from "../lib/theme"

type Adicional = {
  nome: string
  preco: number
}

import type { CartItem } from "../types"

type Props = {
  cart: CartItem[]
  increaseQuantity: (id: string) => void
  decreaseQuantity: (id: string) => void
  onCheckout: () => void
}

export default function Cart({
  cart,
  increaseQuantity,
  decreaseQuantity,
  onCheckout,
}: Props) {

  const {
    lightMode,
    selectedColor,
  } = getThemeSettings()

  const total = cart.reduce(
    (acc, item) =>
      acc + item.preco * item.quantity,
    0
  )

  const cartBg = lightMode
    ? "bg-[#F5F1EA]"
    : "bg-zinc-950"

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
        ${cartBg}
        ${borderColor}
        border
        rounded-3xl
        p-6
        transition-all
      `}
    >

      <h2
        className={`
          text-3xl
          font-black
          mb-6
          ${textPrimary}
        `}
      >
        Carrinho
      </h2>

      {cart.length === 0 ? (

        <div
          className={`
            ${borderColor}
            border
            rounded-2xl
            p-10
            text-center
            ${textSecondary}
          `}
        >
          Seu carrinho está vazio.
        </div>

      ) : (

        <div className="space-y-6">

          {cart.map((item) => (

            <div
              key={item.uniqueId}
              className={`
                border-b
                ${borderColor}
                pb-5
              `}
            >

              <div className="flex justify-between items-start gap-4">

                <div className="flex gap-4 flex-1">

                  {item.imagem && (

                    <img
                      src={item.imagem}
                      alt={item.nome}
                      className="
                        w-20
                        h-20
                        rounded-2xl
                        object-cover
                      "
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://placehold.co/200x200/png"
                      }}
                    />
                  )}

                  <div className="flex-1">

                    <h3
                      className={`
                        font-black
                        text-lg
                        ${textPrimary}
                      `}
                    >
                      {item.nome}
                    </h3>

                    <p
                      className="
                        font-black
                        mt-1
                        text-lg
                      "
                      style={{
                        color: selectedColor,
                      }}
                    >
                      R$ {Number(item.preco).toFixed(2)}
                    </p>

                    {item.adicionaisSelecionados &&
                      item.adicionaisSelecionados.length > 0 && (

                      <div className="mt-3 space-y-1">

                        {item.adicionaisSelecionados.map(
                          (adicional, index) => (

                            <div
                              key={index}
                              className={`
                                flex
                                justify-between
                                text-sm
                                ${textSecondary}
                              `}
                            >

                              <span>
                                + {adicional.nome}
                              </span>

                              <span>
                                R$ {Number(adicional.preco).toFixed(2)}
                              </span>

                            </div>
                          )
                        )}

                      </div>
                    )}

                  </div>

                </div>

                <div className="flex items-center gap-2">

                  <button
                    onClick={() =>
                      decreaseQuantity(item.uniqueId)
                    }
                    className={`
                      w-9
                      h-9
                      rounded-xl
                      transition-all
                      font-bold
                      ${cardBg}
                      ${borderColor}
                      border
                      ${textPrimary}
                    `}
                  >
                    -
                  </button>

                  <span
                    className={`
                      w-5
                      text-center
                      font-bold
                      ${textPrimary}
                    `}
                  >
                    {item.quantity}
                  </span>

                  <button
                    onClick={() =>
                      increaseQuantity(item.uniqueId)
                    }
                    className="
                      w-9
                      h-9
                      rounded-xl
                      text-white
                      font-black
                      transition-all
                      hover:scale-105
                    "
                    style={{
                      backgroundColor:
                        selectedColor,
                    }}
                  >
                    +
                  </button>

                </div>

              </div>

            </div>
          ))}

          <div className="
            flex
            items-center
            justify-between
            pt-2
          ">

            <span
              className={`
                text-2xl
                font-black
                ${textPrimary}
              `}
            >
              Total
            </span>

            <span
              className="
                text-4xl
                font-black
              "
              style={{
                color: selectedColor,
              }}
            >
              R$ {total.toFixed(2)}
            </span>

          </div>

          <button
            onClick={onCheckout}
            className="
              w-full
              text-white
              font-black
              py-4
              rounded-2xl
              transition-all
              hover:scale-[1.01]
            "
            style={{
              backgroundColor:
                selectedColor,
            }}
          >
            Finalizar Pedido
          </button>

        </div>
      )}

    </div>
  )
}