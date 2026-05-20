type CartItem = {
  id: string
  uniqueId: string
  name: string
  price: number
  quantity: number
  observation?: string
  adicionais?: {
    nome: string
    preco: number
  }[]
}

type CartProps = {
  cart: CartItem[]
  increaseQuantity: (uniqueId: string) => void
  decreaseQuantity: (uniqueId: string) => void
  onCheckout: () => void
}

export default function Cart({
  cart,
  increaseQuantity,
  decreaseQuantity,
  onCheckout,
}: CartProps) {

  const total = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  )

  return (

    <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-4 md:p-6 h-fit sticky top-6">

      <h2 className="text-2xl font-bold mb-6">
        Carrinho
      </h2>

      {cart.length === 0 ? (

        <div className="text-center py-10 text-zinc-500 border border-zinc-900 rounded-2xl">
          Seu carrinho está vazio.
        </div>

      ) : (

        <div className="space-y-4">

          {cart.map((item, index) => (

            <div
              key={`${item.uniqueId}-${index}`}
              className="border-b border-zinc-900 pb-4"
            >

              <div className="flex items-start justify-between gap-3">

                <div className="flex-1">

                  <h3 className="font-bold text-base md:text-lg leading-tight">
                    {item.name}
                  </h3>

                  <p className="text-green-400 font-bold text-lg">
                    R$ {(item.price * item.quantity).toFixed(2)}
                  </p>

                  {item.adicionais &&
                    item.adicionais.length > 0 && (

                      <div className="mt-2 space-y-1">

                        {item.adicionais.map((adicional, adIndex) => (

                          <div
                            key={`${item.uniqueId}-${adicional.nome}-${adIndex}`}
                            className="flex justify-between text-xs md:text-sm text-zinc-300"
                          >

                            <span>
                              + {adicional.nome}
                            </span>

                            <span className="text-green-400">
                              R$ {adicional.preco.toFixed(2)}
                            </span>

                          </div>

                        ))}

                      </div>

                    )}

                  {item.observation && (

                    <p className="text-xs md:text-sm text-zinc-400 mt-2">
                      {item.observation}
                    </p>

                  )}

                </div>

                <div className="flex items-center gap-2">

                  <button
                    onClick={() =>
                      decreaseQuantity(item.uniqueId)
                    }
                    className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition"
                  >
                    -
                  </button>

                  <span className="font-bold w-4 text-center">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() =>
                      increaseQuantity(item.uniqueId)
                    }
                    className="w-8 h-8 rounded-lg bg-green-500 hover:bg-green-400 transition"
                  >
                    +
                  </button>

                </div>

              </div>

            </div>

          ))}

          <div className="pt-4">

            <div className="flex items-center justify-between mb-5">

              <span className="text-xl font-bold">
                Total
              </span>

              <span className="text-3xl md:text-4xl font-bold text-green-400">
                R$ {total.toFixed(2)}
              </span>

            </div>

            <button
              onClick={onCheckout}
              className="w-full bg-green-500 hover:bg-green-400 transition py-4 rounded-2xl text-lg font-bold"
            >
              Finalizar Pedido
            </button>

          </div>

        </div>

      )}

    </div>
  )
}