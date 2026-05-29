"use client"

import {
  useEffect,
  useState,
} from "react"

import { getThemeSettings } from "@/app/lib/theme"

type Adicional = {
  nome: string
  preco: number
}

import type { ProdutoFormatado } from "../types"

type Props = {
  open: boolean

  onClose: () => void

  product: ProdutoFormatado | null

  onAdd: (
    produto: ProdutoFormatado,
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

  const {
    lightMode,
    selectedColor,
  } = getThemeSettings()

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
    Number(product.preco) +
    totalAdicionais

  const bgMain = lightMode
    ? "bg-white border border-zinc-200"
    : "bg-zinc-950 border border-zinc-800"

  const textPrimary = lightMode
    ? "text-zinc-900"
    : "text-white"

  const textSecondary = lightMode
    ? "text-zinc-500"
    : "text-zinc-400"

  const inputBg = lightMode
    ? "bg-zinc-100 border border-zinc-200"
    : "bg-zinc-900 border border-zinc-800"

  return (

    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-5">

      <div className={`${bgMain} rounded-3xl w-full max-w-lg overflow-hidden`}>

        {product.imagem && (

          <img
            src={product.imagem}
            alt={product.nome}
            className="w-full h-60 object-cover"
          />

        )}

        <div className="p-6">

          <div className="flex items-start justify-between gap-4">

            <div>

              <h2 className={`text-3xl font-black ${textPrimary}`}>
                {product.nome}
              </h2>

              <p className={`${textSecondary} mt-2`}>
                {product.descricao}
              </p>

            </div>

            <button
              onClick={onClose}
              className={`${textSecondary} hover:opacity-70 text-2xl`}
            >
              ×
            </button>

          </div>

          {product.adicionais &&
            product.adicionais.length > 0 && (

              <div className="mt-6">

                <h3 className={`font-bold text-lg mb-3 ${textPrimary}`}>
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
                          className={`
                            w-full
                            flex
                            items-center
                            justify-between
                            p-4
                            rounded-2xl
                            border
                            transition
                            ${ativo
                              ? ""
                              : inputBg
                            }
                          `}
                          style={
                            ativo
                              ? {
                                  borderColor:
                                    selectedColor,
                                  backgroundColor:
                                    `${selectedColor}15`,
                                }
                              : {}
                          }
                        >

                          <span className={textPrimary}>
                            + {adicional.nome}
                          </span>

                          <span
                            className="font-bold"
                            style={{
                              color:
                                selectedColor,
                            }}
                          >
                            R${" "}
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

            <h3 className={`font-bold text-lg mb-3 ${textPrimary}`}>
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
              className={`
                w-full
                h-28
                rounded-2xl
                p-4
                outline-none
                resize-none
                ${inputBg}
                ${textPrimary}
              `}
            />

          </div>

          <div className="mt-6 flex items-center justify-between">

            <div>

              <p className={`${textSecondary} text-sm`}>
                Total
              </p>

              <h3
                className="text-3xl font-black"
                style={{
                  color:
                    selectedColor,
                }}
              >
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
              className="
                transition
                px-8
                py-4
                rounded-2xl
                font-bold
                text-lg
                text-white
                hover:scale-105
              "
              style={{
                backgroundColor:
                  selectedColor,
              }}
            >
              Adicionar
            </button>

          </div>

        </div>

      </div>

    </div>
  )
}