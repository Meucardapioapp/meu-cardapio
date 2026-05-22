"use client"

type Adicional = {
  nome: string
  preco: number
}

type CartItem = {
  uniqueId: string
  name: string
  price: number
  quantity: number
  image?: string
  adicionaisSelecionados?: Adicional[]
}

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

  const total = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  )

  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6">

      <h2 className="text-3xl font-bold mb-6">
        Carrinho
      </h2>

      {cart.length === 0 ? (

        <div className="border border-zinc-800 rounded-2xl p-10 text-center text-zinc-500">
          Seu carrinho está vazio.
        </div>

      ) : (

        <div className="space-y-6">

          {cart.map((item) => (

            <div
              key={item.uniqueId}
              className="border-b border-zinc-800 pb-5"
            >

              <div className="flex justify-between items-start gap-4">

                <div className="flex gap-4 flex-1">

                  {item.image && (

                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                  )}

                  <div className="flex-1">

                    <h3 className="font-bold text-lg">
                      {item.name}
                    </h3>

                    <p className="text-green-400 font-bold mt-1">
                      R$ {Number(item.price).toFixed(2)}
                    </p>

                    {item.adicionaisSelecionados &&
                      item.adicionaisSelecionados.length > 0 && (

                      <div className="mt-3 space-y-1">

                        {item.adicionaisSelecionados.map(
                          (adicional, index) => (

                            <div
                              key={index}
                              className="flex justify-between text-sm text-green-400"
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
                    className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800"
                  >
                    -
                  </button>

                  <span className="w-5 text-center">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() =>
                      increaseQuantity(item.uniqueId)
                    }
                    className="w-8 h-8 rounded-lg bg-green-500 hover:bg-green-400 text-black font-bold"
                  >
                    +
                  </button>

                </div>
              </div>

            </div>
          ))}

          <div className="flex items-center justify-between pt-2">

            <span className="text-2xl font-bold">
              Total
            </span>

            <span className="text-4xl font-bold text-green-400">
              R$ {total.toFixed(2)}
            </span>

          </div>

          <button
            onClick={onCheckout}
            className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-4 rounded-2xl transition"
          >
            Finalizar Pedido
          </button>

        </div>
      )}
    </div>
  )
}