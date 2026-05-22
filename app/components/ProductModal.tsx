"use client"

import {
  useEffect,
  useState,
} from "react"

type Adicional = {
  nome: string
  preco: number
}

type Produto = {
  id: string
  name: string
  description: string
  price: number
  image: string
  adicionais?: Adicional[]
}

type Props = {
  open: boolean

  onClose: () => void

  product: Produto | null

  onAdd: (
    produto: Produto,
    observation?: string,
    adicionaisSelecionados?: Adicional[]
  ) => void
}

export default function ProductModal({
  open,
  onClose,
  product,
  onAdd,
}: Props) {

  const [observation, setObservation] =
    useState("")

  const [
    adicionaisSelecionados,
    setAdicionaisSelecionados,
  ] = useState<Adicional[]>([])

  useEffect(() => {

    if (open) {

      setObservation("")

      setAdicionaisSelecionados([])
    }

  }, [open])

  if (!open || !product)
    return null

  function toggleAdicional(
    adicional: Adicional
  ) {

    const existe =
      adicionaisSelecionados.find(
        (item) =>
          item.nome === adicional.nome
      )

    if (existe) {

      setAdicionaisSelecionados(

        adicionaisSelecionados.filter(
          (item) =>
            item.nome !==
            adicional.nome
        )
      )

      return
    }

    setAdicionaisSelecionados([
      ...adicionaisSelecionados,
      adicional,
    ])
  }

  const totalAdicionais =
    adicionaisSelecionados.reduce(
      (acc, item) =>
        acc + Number(item.preco),
      0
    )

  const total =
    Number(product.price) +
    totalAdicionais

  return (

    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-5">

      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden">

        <img
          src={product.image}
          alt={product.name}
          className="w-full h-60 object-cover"
        />

        <div className="p-6">

          <div className="flex items-start justify-between gap-4">

            <div>

              <h2 className="text-3xl font-black">
                {product.name}
              </h2>

              <p className="text-zinc-400 mt-2">
                {product.description}
              </p>

            </div>

            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white text-2xl"
            >
              ×
            </button>

          </div>

          {product.adicionais &&
            product.adicionais.length > 0 && (

              <div className="mt-6">

                <h3 className="font-bold text-lg mb-3">
                  Adicionais
                </h3>

                <div className="space-y-2">

                  {product.adicionais.map(
                    (
                      adicional,
                      index
                    ) => {

                      const ativo =
                        adicionaisSelecionados.find(
                          (item) =>
                            item.nome ===
                            adicional.nome
                        )

                      return (

                        <button
                          key={index}
                          type="button"
                          onClick={() =>
                            toggleAdicional(
                              adicional
                            )
                          }
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border transition ${
                            ativo
                              ? "border-green-500 bg-green-500/10"
                              : "border-zinc-800 bg-zinc-900"
                          }`}
                        >

                          <span>
                            + {adicional.nome}
                          </span>

                          <span className="text-green-400 font-bold">
                            R$ {" "}
                            {Number(
                              adicional.preco || 0
                            ).toFixed(2)}
                          </span>

                        </button>

                      )
                    }
                  )}

                </div>

              </div>

            )}

          <div className="mt-6">

            <h3 className="font-bold text-lg mb-3">
              Observações
            </h3>

            <textarea
              value={observation}
              onChange={(e) =>
                setObservation(
                  e.target.value
                )
              }
              placeholder="Ex: sem cebola, molho separado..."
              className="w-full h-28 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 outline-none resize-none"
            />

          </div>

          <div className="mt-6 flex items-center justify-between">

            <div>

              <p className="text-zinc-400 text-sm">
                Total
              </p>

              <h3 className="text-3xl font-black text-green-400">
                R$ {total.toFixed(2)}
              </h3>

            </div>

            <button
              type="button"
              onClick={() => {

                onAdd(
                  product,
                  observation,
                  adicionaisSelecionados
                )

                onClose()
              }}
              className="bg-green-500 hover:bg-green-400 transition px-8 py-4 rounded-2xl font-bold text-lg"
            >
              Adicionar
            </button>

          </div>

        </div>

      </div>

    </div>
  )
}