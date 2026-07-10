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


type ObrigatorioSelecionado = {
  grupo: string;
  nome: string;
  preco: number;
};

type Props = {
  open: boolean

  onClose: () => void

  product: ProdutoFormatado | null

  corPrincipal: string


onAdd: (
  produto: ProdutoFormatado,
  observation?: string,
  adicionaisSelecionados?: Adicional[],
  obrigatoriosSelecionados?: ObrigatorioSelecionado[]
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

  if (!open) return;

  const scrollY = window.scrollY;

  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
  document.body.style.overflow = "hidden";

  return () => {

    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    document.body.style.overflow = "";

    window.scrollTo(0, scrollY);

  };

}, [open]);

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

 <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center px-3 pt-3 pb-0">

      <div
  className={`
    ${bgMain}
    rounded-3xl
    w-full
    max-w-[520px]
h-[96dvh]
max-h-[96dvh]
flex
flex-col
  `}
>

<div className="relative">

  <button
    onClick={onClose}
    aria-label="Fechar"
    className="
      absolute
      top-5
      right-5
      w-11
      h-11
      rounded-full
      bg-white
      border
      border-zinc-200
      shadow-md
      flex
      items-center
      justify-center
      z-20
    "
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  </button>

</div>

<div className="flex-1 overflow-y-auto p-6 pb-32">

  {product.imagem && (

    <div className="flex justify-center">

      <img
        src={product.imagem}
        alt={product.nome}
        className="
          w-44
          h-44
          rounded-3xl
          object-cover
          shadow-lg
        "
      />

    </div>

  )}

  <div className="text-center mt-6">

    <h2
      className="
        text-4xl
        font-black
        text-zinc-900
      "
    >
      {product.nome}
    </h2>

    <p
      className="
        mt-3
        text-zinc-500
        leading-7
        max-w-sm
        mx-auto
      "
    >
      {product.descricao}
    </p>

    <h3
      className="text-4xl font-black mt-5"
      style={{
        color: corPrincipal,
      }}
    >
      R$ {Number(product.preco).toFixed(2)}
    </h3>

  </div>

  <div className="border-t border-zinc-200 my-8" />

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

  {grupo.maximo === 999
    ? `Selecione pelo menos ${grupo.minimo} opção${grupo.minimo > 1 ? "ões" : ""}`
    : grupo.minimo === grupo.maximo
      ? `Selecione ${grupo.minimo} opção${grupo.minimo > 1 ? "ões" : ""}`
      : `Selecione de ${grupo.minimo} até ${grupo.maximo} opções`
  }

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

  let novos: string[]

  if (atuais.includes(opcao.id)) {

    novos = atuais.filter(
      (id: string) => id !== opcao.id
    )

  } else {

    if (
      grupo.maximo !== 999 &&
      atuais.length >= grupo.maximo
    ) {
      return
    }

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

</div> {/* fecha o scroll */}

<div
className="
bg-white
border-t
border-zinc-200
px-6
py-4
flex
items-center
justify-between
shrink-0
"
>

  <div>

    <p className={`${textSecondary} text-sm`}>
      Total
    </p>

    <h3
      className="text-2xl font-black"
      style={{
        color: corPrincipal,
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

if (selecionados.length < grupo.minimo) {

  alert(
    `Selecione pelo menos ${grupo.minimo} item(ns) de "${grupo.nome}".`
  )

  return

}

      }

const obrigatoriosFormatados = gruposObrigatorios.flatMap((grupo) => {

  const selecionados =
    obrigatoriosSelecionados[grupo.id] || [];

  return opcoesObrigatorias
    .filter(
      (opcao) =>
        opcao.grupo_id === grupo.id &&
        selecionados.includes(opcao.id)
    )
    .map((opcao) => ({
      grupo: grupo.nome,
      nome: opcao.nome,
      preco: Number(opcao.preco),
    }));

});

onAdd(
  product,
  observation,
  adicionaisSelecionados,
  obrigatoriosFormatados
);

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
      backgroundColor: corPrincipal,
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