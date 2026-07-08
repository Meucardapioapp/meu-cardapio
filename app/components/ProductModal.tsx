"use client"

import {
  useEffect,
  useState,
} from "react"

import { supabase } from "../../lib/supabase"


type Adicional = {
  nome: string
  preco: number
}

import type { ProdutoFormatado } from "../types"

type Props = {
  open: boolean

  onClose: () => void

  product: ProdutoFormatado | null

  corPrincipal: string

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
  corPrincipal,
}: Props) {

 

  console.log("COR MODAL:", corPrincipal)

  const lightMode = true

  const [observation, setObservation] =
    useState("")

  const [
    adicionaisSelecionados,
    setAdicionaisSelecionados,
  ] = useState<Adicional[]>([])

  const [gruposObrigatorios, setGruposObrigatorios] = useState<any[]>([])

const [opcoesObrigatorias, setOpcoesObrigatorias] = useState<any[]>([])

const [obrigatoriosSelecionados, setObrigatoriosSelecionados] =
useState<Record<string,string[]>>({})

useEffect(() => {

  if (!open || !product) return

  async function carregarGrupos() {

const { data: grupos, error } = await supabase
  .from("grupos_obrigatorios")
  .select("*")
  .eq("produto_id", product!.id)
  .order("ordem")
  

console.log("PRODUTO ID:", product!.id)
console.log("GRUPOS:", grupos)
console.log("ERRO:", error)

    setGruposObrigatorios(grupos || [])

    if (!grupos || grupos.length === 0) {

      setOpcoesObrigatorias([])

      return

    }

    const ids = grupos.map(grupo => grupo.id)

    const { data: opcoes } = await supabase
      .from("grupo_obrigatorio_opcoes")
      .select("*")
      .in("grupo_id", ids)
      .order("ordem")

      console.log("IDS:", ids)
console.log("OPCOES:", opcoes)

    setOpcoesObrigatorias(opcoes || [])

  }

  carregarGrupos()

  setObservation("")

  setAdicionaisSelecionados([])

}, [open, product])

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
    (acc, item) => acc + Number(item.preco),
    0
  )

const totalObrigatorios =
  opcoesObrigatorias
    .filter(opcao =>
     Object.values(obrigatoriosSelecionados)
  .flat()
  .includes(opcao.id)
    )
    .reduce(
      (acc, opcao) => acc + Number(opcao.preco),
      0
    )

const total =
  Number(product.preco) +
  totalAdicionais +
  totalObrigatorios

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

      <div
  className={`
    ${bgMain}
    rounded-3xl
    w-full
    max-w-[520px]
    max-h-[90vh]
    overflow-y-auto
  `}
>

        {product.imagem && (

          <img
            src={product.imagem}
            alt={product.nome}
            className="w-full h-36 object-cover"
          />

        )}

        <div className="p-4">

          <div className="flex items-start justify-between gap-4">

            <div>

              <h2 className={`text-2xl font-black ${textPrimary}`}>
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

          {gruposObrigatorios.map((grupo) => {

  const opcoes = opcoesObrigatorias.filter(
    op => op.grupo_id === grupo.id
  )

  return (

<div
  key={grupo.id}
  className="
  mt-8
"
>

<div className="flex items-start justify-between mb-5">

        <div>

<h3
className="
text-[22px]
font-black
leading-none
text-zinc-900
"
>

            {grupo.nome}

          </h3>

<p className="mt-1 text-sm text-zinc-500">

            Escolha de {grupo.minimo} até {grupo.maximo}

          </p>

        </div>

<span
className="
text-[11px]
font-semibold
bg-red-50
text-red-500
px-3
py-1
rounded-full
"
>
          Obrigatório
        </span>

      </div>

      <div className="space-y-3 mt-4">

        {opcoes.map(opcao => (

          <label
            key={opcao.id}
className={`
flex
items-center
justify-between
rounded-2xl
border
border-zinc-200
bg-white
px-4
py-4
cursor-pointer
transition-all
duration-200
hover:border-zinc-300
`}
          >

            <div className="flex items-center gap-4">

<input
  type="checkbox"
  checked={
    (obrigatoriosSelecionados[grupo.id] || []).includes(opcao.id)
  }
  onChange={() => {

    const atuais =
      obrigatoriosSelecionados[grupo.id] || []

    let novos

    if (atuais.includes(opcao.id)) {

      novos = atuais.filter(
        (id: string) => id !== opcao.id
      )

    } else {

      if (atuais.length >= grupo.maximo) return

      novos = [...atuais, opcao.id]

    }

    setObrigatoriosSelecionados({
      ...obrigatoriosSelecionados,
      [grupo.id]: novos,
    })

  }}
/>

<div>

<p className="font-semibold">

{opcao.nome}

</p>

</div>

            </div>

            <span>

              + R$ {Number(opcao.preco).toFixed(2)}

            </span>

          </label>

        ))}

      </div>

    </div>

  )

})}

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
                            py-2 
                            px-3 
                            rounded-lg
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
                                    corPrincipal,
                                  backgroundColor:
                                    `${corPrincipal}15`,
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
                                corPrincipal,
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
                h-16
                rounded-2xl
                p-4
                outline-none
                resize-none
                ${inputBg}
                ${textPrimary}
              `}
            />

          </div>

         <div
className="
sticky
bottom-0
bg-white
px-1
pt-3
pb-3
mt-6
flex
items-center
justify-between
border-t
border-zinc-200
"
>
            <div>

              <p className={`${textSecondary} text-sm`}>
                Total
              </p>

              <h3
                className="text-2xl font-black"
                style={{
                  color:
                    corPrincipal,
                }}
              >
                R$ {total.toFixed(2)}
              </h3>

            </div>

            <button
              type="button"
              onClick={() => {

for (const grupo of gruposObrigatorios) {

  const selecionados =
    obrigatoriosSelecionados[grupo.id] || []

  if (selecionados.length < grupo.maximo) {

    alert(
      `Selecione ${grupo.maximo} itens de "${grupo.nome}".`
    )

    return
  }

}

onAdd(
  product,
  observation,
  adicionaisSelecionados
)

onClose()

              }}
              className="
                transition
                px-6
                py-3
                rounded-xl
                font-bold
                text-base
                text-white
                hover:scale-105
              "
              style={{
                backgroundColor:
                  corPrincipal,
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