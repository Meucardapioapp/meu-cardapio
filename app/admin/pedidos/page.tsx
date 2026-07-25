"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"

type Pedido = {
  id: number
   numero_pedido: number
    tipo_pedido: string

  cliente: string
  telefone: string

  bairro: string
  rua: string
  numero: string

  complemento: string
  referencia: string

  observacoes: string

  payment_method: string
  pagamento: string

  total: number
  total_pago: number

  status: string

  itens: any[]

  created_at: string
  restaurante_id: string
}

export default function PedidosPage() {

  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)

  const [busca, setBusca] = useState("")
  const [statusFiltro, setStatusFiltro] = useState("todos")
  const [drawerAberto, setDrawerAberto] =
  useState(false)

const [pedidoSelecionado, setPedidoSelecionado] =
  useState<Pedido | null>(null)

  async function buscarPedidos() {

    console.log("========== BUSCANDO PEDIDOS ==========");

    const restauranteId =
      localStorage.getItem("restaurante_id")

    if (!restauranteId) return

const { data, error } =
  await supabase
    .from("pedidos")
    .select("*")
    .eq("restaurante_id", restauranteId)
.or(
  "payment_method.eq.cash,payment_method.eq.card_delivery,payment_status.eq.approved"
)
    .order("created_at", {
      ascending: false,
    })

    if (error) {

      console.log(error)

      return
    }

    console.log("========== DADOS VINDOS DO SUPABASE ==========");
console.table(data);

setPedidos(data || []);

    setLoading(false)
  }

  function abrirPedido(
  pedido: Pedido
) {

  setPedidoSelecionado(pedido)

  setDrawerAberto(true)

}

function fecharPedido() {

  setDrawerAberto(false)

  setPedidoSelecionado(null)

}

  async function atualizarStatus(
    id: number,
    status: string
  ) {

    const restauranteId =
      localStorage.getItem("restaurante_id")

    const { error } =
      await supabase
        .from("pedidos")
        .update({
          status,
        })
        .eq("id", id)
        .eq(
          "restaurante_id",
          restauranteId
        )

    if (error) {

      alert("Erro ao atualizar")

      return
    }

    setPedidos((old) =>
      old.map((pedido) =>
        pedido.id === id
          ? {
              ...pedido,
              status,
            }
          : pedido
      )
    )
  }

  useEffect(() => {

    buscarPedidos()

    const channel =
      supabase
        .channel("pedidos")

        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "pedidos",
          },
          () => {

            buscarPedidos()

          }
        )

        .subscribe()

    return () => {

      supabase.removeChannel(channel)

    }

  }, [])

  const pedidosFiltrados =
    useMemo(() => {

      return pedidos.filter((pedido) => {

        const texto =
          (
            pedido.cliente +
            pedido.telefone +
            pedido.rua +
            pedido.bairro +
            pedido.id
          )
            .toLowerCase()

        const buscaOk =
          texto.includes(
            busca.toLowerCase()
          )

        const statusOk =
          statusFiltro === "todos"
            ? true
            : pedido.status === statusFiltro

        return buscaOk && statusOk

      })

    }, [pedidos, busca, statusFiltro])

  if (loading) {

    return (

      <div className="min-h-screen flex items-center justify-center">

        Carregando...

      </div>

    )

  }

  return (

    <main className="min-h-screen bg-[#f7f8fc] p-8">

      <div className="max-w-[1500px] mx-auto">

        {/* Header */}

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-5xl font-black text-zinc-900">

              Pedidos

            </h1>

            <p className="mt-2 text-zinc-500">

              Gerencie e acompanhe todos os pedidos.

            </p>

          </div>

          <button
            className="
            h-14
            px-7
            rounded-2xl
            bg-[#6D1F2F]
            text-white
            font-semibold
            hover:bg-[#531723]
            transition
            "
          >

            Exportar relatório

          </button>

        </div>

        {/* Cards */}

        <div className="grid grid-cols-4 gap-6 mt-8">

          <div className="bg-white rounded-3xl p-7 shadow-sm border">

            <p className="text-zinc-500">

              Em aberto

            </p>

            <h2 className="text-5xl font-black mt-2">

              {
                pedidos.filter(
                  p => p.status === "pendente"
                ).length
              }

            </h2>

            <span className="text-orange-500 font-semibold">

              Aguardando

            </span>

          </div>

          <div className="bg-white rounded-3xl p-7 shadow-sm border">

            <p className="text-zinc-500">

              Em preparação

            </p>

            <h2 className="text-5xl font-black mt-2">

              {
                pedidos.filter(
                  p => p.status === "aceito"
                ).length
              }

            </h2>

            <span className="text-blue-600 font-semibold">

              Cozinha

            </span>

          </div>

          <div className="bg-white rounded-3xl p-7 shadow-sm border">

            <p className="text-zinc-500">

              Saiu para entrega

            </p>

            <h2 className="text-5xl font-black mt-2">

              {
                pedidos.filter(
                  p => p.status === "entrega"
                ).length
              }

            </h2>

            <span className="text-violet-600 font-semibold">

              Em rota

            </span>

          </div>

          <div className="bg-white rounded-3xl p-7 shadow-sm border">

            <p className="text-zinc-500">

              Entregues

            </p>

            <h2 className="text-5xl font-black mt-2">

              {
                pedidos.filter(
                  p => p.status === "concluido"
                ).length
              }

            </h2>

            <span className="text-green-600 font-semibold">

              Finalizados

            </span>

          </div>

        </div>
        
                {/* Barra de pesquisa */}

        <div className="mt-8 bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">

          <div className="flex items-center gap-4">

            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por pedido, cliente, telefone ou endereço..."
              className="
              flex-1
              h-14
              rounded-2xl
              border
              border-zinc-300
              px-5
              outline-none
              focus:border-[#6D1F2F]
              "
            />

            <select
              value={statusFiltro}
              onChange={(e) =>
                setStatusFiltro(e.target.value)
              }
              className="
              w-64
              h-14
              rounded-2xl
              border
              border-zinc-300
              px-4
              outline-none
              "
            >
              <option value="todos">
                Todos os status
              </option>

              <option value="pendente">
                Em aberto
              </option>

              <option value="aceito">
                Em preparação
              </option>

              <option value="entrega">
                Saiu para entrega
              </option>

              <option value="concluido">
                Entregues
              </option>

            </select>

          </div>

        </div>

        {/* Tabela */}

        <div className="mt-8 bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">

          <table className="w-full">

            <thead className="bg-zinc-50">

              <tr className="border-b border-zinc-200">

                <th className="text-left px-6 py-5 font-semibold text-zinc-500">
                  Pedido
                </th>

                <th className="text-left px-6 py-5 font-semibold text-zinc-500">
                  Cliente
                </th>

                <th className="text-left px-6 py-5 font-semibold text-zinc-500">
                  Endereço
                </th>

                <th className="text-left px-6 py-5 font-semibold text-zinc-500">

Itens

</th>

                <th className="text-left px-6 py-5 font-semibold text-zinc-500">
                  Pagamento
                </th>

                <th className="text-left px-6 py-5 font-semibold text-zinc-500">
                  Total
                </th>

                <th className="text-left px-6 py-5 font-semibold text-zinc-500">
                  Status
                </th>

                <th className="text-left px-6 py-5 font-semibold text-zinc-500">
                  Ações
                </th>

              </tr>

            </thead>

            <tbody>

              {pedidosFiltrados.map((pedido) => (

<tr
  key={pedido.id}
  className="border-b border-zinc-100 hover:bg-zinc-50 transition"
>

  <td className="px-6 py-6">

    <div className="font-bold text-zinc-900">

      #{pedido.numero_pedido ?? pedido.id}

    </div>

    <div className="text-sm text-zinc-500 mt-1">

      {new Date(pedido.created_at).toLocaleString("pt-BR")}

    </div>

  </td>

  <td className="px-6 py-6">

    <div className="font-semibold text-zinc-900">

      {pedido.cliente}

    </div>

    <div className="text-sm text-zinc-500">

      {pedido.telefone}

    </div>

  </td>

 <td className="px-6 py-6">

  {pedido.tipo_pedido === "retirada" ? (

    <>
      <div className="font-semibold text-blue-600">
        🛍️ Retirada no local
      </div>

      <div className="text-sm text-zinc-500">
        Cliente irá buscar o pedido
      </div>
    </>

  ) : (

    <>
      <div className="text-zinc-900">
        {pedido.rua}, {pedido.numero}
      </div>

      <div className="text-sm text-zinc-500">
        {pedido.bairro}
      </div>
    </>

  )}

</td>

  <td className="px-6 py-6">

  <div className="font-semibold text-zinc-900">

    {pedido.itens?.length || 0} itens

  </div>

  <button
    onClick={() => abrirPedido(pedido)}
    className="
      mt-1
      text-[#B11E3B]
      font-semibold
      text-sm
      hover:underline
    "
  >

    Ver detalhes

  </button>

</td>

  <td className="px-6 py-6">

    <span className="px-4 py-2 rounded-full bg-zinc-100 text-zinc-700 font-medium">

      {pedido.pagamento}

    </span>

  </td>

  <td className="px-6 py-6">

    <span className="font-bold text-green-600 text-lg">

      R$ {Number(pedido.total).toFixed(2)}

    </span>

  </td>

  <td className="px-6 py-6">

    <span
      className={`
      px-4
      py-2
      rounded-full
      text-sm
      font-semibold

      ${
        pedido.status === "pendente"
          ? "bg-orange-100 text-orange-700"
          : pedido.status === "aceito"
          ? "bg-blue-100 text-blue-700"
          : pedido.status === "entrega"
          ? "bg-purple-100 text-purple-700"
          : "bg-green-100 text-green-700"
      }
      `}
    >

      {pedido.status}

    </span>

  </td>

  <td className="px-6 py-6">

    <div className="flex flex-wrap gap-2">


{pedido.status === "pendente" && (
  <button
    onClick={() =>
      atualizarStatus(pedido.id, "aceito")
    }
    className="
      px-4
      py-2
      rounded-xl
      bg-blue-500
      hover:bg-blue-600
      text-white
      text-sm
      font-semibold
      transition
    "
  >
    Aceitar
  </button>
)}

{pedido.status === "aceito" && (
  <button
    onClick={() =>
      atualizarStatus(pedido.id, "preparo")
    }
    className="
      px-4
      py-2
      rounded-xl
      bg-yellow-500
      hover:bg-yellow-600
      text-white
      text-sm
      font-semibold
      transition
    "
  >
    Em preparação
  </button>
)}

{pedido.status === "preparo" && (
  <button
    onClick={() =>
      atualizarStatus(pedido.id, "entrega")
    }
    className="
      px-4
      py-2
      rounded-xl
      bg-violet-600
      hover:bg-violet-700
      text-white
      text-sm
      font-semibold
      transition
    "
  >
    Saiu para entrega
  </button>
)}

{pedido.status === "entrega" && (
  <button
    onClick={() =>
      atualizarStatus(pedido.id, "concluido")
    }
    className="
      px-4
      py-2
      rounded-xl
      bg-green-600
      hover:bg-green-700
      text-white
      text-sm
      font-semibold
      transition
    "
  >
    Entregue
  </button>
)}

{pedido.status === "concluido" && (
  <span
    className="
      px-4
      py-2
      rounded-xl
      bg-green-100
      text-green-700
      text-sm
      font-semibold
    "
  >
    Pedido finalizado
  </span>
)}

    </div>

  </td>

</tr>

))}

{pedidosFiltrados.length === 0 && (

<tr>

<td
colSpan={7}
className="py-20 text-center text-zinc-500"
>

Nenhum pedido encontrado.

</td>

</tr>

)}

</tbody>

</table>

</div>

{drawerAberto && pedidoSelecionado && (

<div
  className="
    fixed
    inset-0
    z-50
    flex
    justify-end
    bg-black/30
  "
  onClick={fecharPedido}
>

  <div
    onClick={(e) => e.stopPropagation()}
    className="
      w-[640px]
      h-screen
      bg-[#fafafa]
      shadow-[0_0_60px_rgba(0,0,0,.15)]
      overflow-y-auto
      px-8
      py-7
"
  >

    <div className="flex justify-between items-center">

   <div>

<h2 className="text-4xl font-black text-zinc-900">

Pedido #{pedidoSelecionado.numero_pedido ?? pedidoSelecionado.id}

</h2>

<div className="flex items-center gap-3 mt-3">

<span
className={`
px-4
py-2
rounded-full
text-sm
font-semibold

${
pedidoSelecionado.status === "pendente"
? "bg-orange-100 text-orange-700"

: pedidoSelecionado.status === "aceito"
? "bg-blue-100 text-blue-700"

: pedidoSelecionado.status === "preparo"
? "bg-yellow-100 text-yellow-700"

: pedidoSelecionado.status === "entrega"
? "bg-violet-100 text-violet-700"

: "bg-green-100 text-green-700"
}
`}
>

{pedidoSelecionado.status}

</span>

<p className="text-zinc-500">

{new Date(
pedidoSelecionado.created_at
).toLocaleString("pt-BR")}

</p>

</div>

</div>

      <button
        onClick={fecharPedido}
        className="text-3xl"
      >
        ×
      </button>

    </div>

    <div className="mt-8 space-y-6">

     <div className="grid grid-cols-2 gap-5">

<div className="bg-white rounded-3xl border border-zinc-200 p-6">

<p className="text-xs uppercase tracking-wider text-zinc-400">

Cliente

</p>

<div className="flex items-center gap-4 mt-4">

<div className="w-14 h-14 rounded-full bg-[#6D1F2F] flex items-center justify-center text-white text-xl font-bold">

{pedidoSelecionado.cliente.charAt(0).toUpperCase()}

</div>

<div>

<h3 className="font-bold text-lg">

{pedidoSelecionado.cliente}

</h3>

<p className="text-zinc-500">

{pedidoSelecionado.telefone}

</p>

</div>

</div>

</div>

<div className="bg-white rounded-3xl border border-zinc-200 p-6">








<p className="text-xs uppercase tracking-wider text-zinc-400">
  {pedidoSelecionado.tipo_pedido === "retirada"
    ? "MODALIDADE"
    : "ENDEREÇO"}
</p>

<div className="mt-4">

  {pedidoSelecionado.tipo_pedido === "retirada" ? (

    <div className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-blue-700 font-semibold">
      🛍️ Retirada no local
    </div>

  ) : (

    <>

      <p className="font-semibold text-lg">
        {pedidoSelecionado.rua}, {pedidoSelecionado.numero}
      </p>

      {pedidoSelecionado.complemento && (
        <p className="text-zinc-600 mt-2">
          Complemento: {pedidoSelecionado.complemento}
        </p>
      )}

      {pedidoSelecionado.referencia && (
        <p className="text-zinc-600">
          Referência: {pedidoSelecionado.referencia}
        </p>
      )}

      <p className="text-zinc-500 mt-2">
        {pedidoSelecionado.bairro}
      </p>

    </>

  )}

</div>






</div>

<div className="bg-white rounded-3xl border border-zinc-200 p-6">

<p className="text-xs uppercase tracking-wider text-zinc-400">

Pagamento

</p>

<div className="mt-4 inline-flex px-4 py-2 rounded-full bg-green-50 text-green-700 font-semibold">

{
  pedidoSelecionado.payment_method === "cash"
    ? "Dinheiro"
    : pedidoSelecionado.payment_method === "pix"
    ? "Pix"
    : pedidoSelecionado.payment_method === "card_delivery"
    ? "Cartão de Crédito/Débito"
    : pedidoSelecionado.payment_method === "credit_card"
    ? "Cartão de Crédito"
    : pedidoSelecionado.payment_method === "apple_pay"
    ? "Apple Pay"
    : pedidoSelecionado.payment_method === "google_pay"
    ? "Google Pay"
    : pedidoSelecionado.payment_method
}

</div>

</div>

<div className="bg-[#6D1F2F] rounded-3xl p-6 text-white">

<p className="uppercase tracking-wider text-white/70 text-xs">

Total

</p>

<h2 className="text-3xl font-black mt-4">

R$ {Number(pedidoSelecionado.total).toFixed(2)}

</h2>

</div>

</div>

<div className="mt-8 border rounded-2xl p-6">

  <div className="flex items-center justify-between">

    <h3 className="font-bold text-lg">
      Itens do pedido
    </h3>

    <span className="text-sm text-zinc-500">

      {
  (
    Array.isArray(pedidoSelecionado.itens)
      ? pedidoSelecionado.itens
      : typeof pedidoSelecionado.itens === "string"
      ? JSON.parse(pedidoSelecionado.itens || "[]")
      : []
  ).length
} itens

    </span>

  </div>

  <div className="mt-5 space-y-4">

  {(
  Array.isArray(pedidoSelecionado.itens)
    ? pedidoSelecionado.itens
    : typeof pedidoSelecionado.itens === "string"
    ? JSON.parse(pedidoSelecionado.itens || "[]")
    : []
).map((item: any, index: number) => {

 console.dir(item, { depth: null })

  return (

    <div
      key={index}
      className="
        flex
        items-center
        justify-between
        border-b
        border-zinc-100
        pb-4
      "
    >

      <div className="flex gap-4">

        <div
          className="
            w-16
            h-16
            rounded-xl
            bg-zinc-100
            overflow-hidden
            flex
            items-center
            justify-center
          "
        >

          {item.imagem ? (

            <img
              src={item.imagem}
              alt={item.nome}
              className="w-full h-full object-cover"
            />

          ) : (

            <span className="text-2xl">
              🍔
            </span>

          )}

        </div>

<div>

  <p className="font-bold">
    {item.quantity || 1}x {item.nome}
  </p>

  {item.descricao && (
    <p className="text-sm text-zinc-500 mt-1">
      {item.descricao}
    </p>
  )}

  {item.obrigatoriosSelecionados?.length > 0 && (
    <div className="mt-3">
      <p className="text-xs uppercase font-bold text-zinc-400">
        Obrigatórios
      </p>

      {item.obrigatoriosSelecionados.map((opcao: any, index: number) => (
        <div
          key={index}
          className="text-sm text-zinc-700"
        >
          • {opcao.grupo}: {opcao.nome}
          {opcao.preco > 0 &&
            ` (+R$ ${Number(opcao.preco).toFixed(2)})`}
        </div>
      ))}
    </div>
  )}

  {item.adicionaisSelecionados?.length > 0 && (
    <div className="mt-3">
      <p className="text-xs uppercase font-bold text-zinc-400">
        Adicionais
      </p>

      {item.adicionaisSelecionados.map((adicional: any, index: number) => (
        <div
          key={index}
          className="text-sm text-zinc-700"
        >
          • {adicional.nome}
          {adicional.preco > 0 &&
            ` (+R$ ${Number(adicional.preco).toFixed(2)})`}
        </div>
      ))}
    </div>
  )}

  {item.observacao && (
    <div className="mt-3">
      <p className="text-xs uppercase font-bold text-zinc-400">
        Observação
      </p>

      <p className="text-sm italic text-zinc-700">
        {item.observacao}
      </p>
    </div>
  )}

</div>

      </div>

      <div className="font-bold text-zinc-800">

        R$ {Number(item.preco || 0).toFixed(2)}

      </div>

    </div>

    )
})}

</div>

</div>

<div className="mt-6">

  <button
    onClick={() =>
      window.open(
        `/imprimir/${pedidoSelecionado.id}`,
        "_blank"
      )
    }
    className="
      w-full
      h-14
      rounded-2xl
      bg-[#1E1E22]
      hover:bg-black
      text-white
      font-bold
      transition
      flex
      items-center
      justify-center
      gap-3
    "
  >
    🖨️ Imprimir pedido
  </button>

</div>

<div className="mt-8 border rounded-3xl bg-white p-6">

  <h3 className="font-bold text-lg mb-8">
    Atualizar status do pedido
  </h3>

  <div className="flex items-center justify-between">

    <div className="flex flex-col items-center flex-1">



<button
  onClick={() => {
    atualizarStatus(pedidoSelecionado.id, "pendente");

    setPedidoSelecionado({
      ...pedidoSelecionado,
      status: "pendente",
    });
  }}
  className={`
    w-14
    h-14
    rounded-full
    flex
    items-center
    justify-center
    text-2xl
    cursor-pointer

    ${
      pedidoSelecionado.status === "pendente"
        ? "bg-[#6D1F2F] text-white"
        : "bg-green-100"
    }
  `}
>
  🕒
</button>



      <span className="mt-3 text-sm font-medium">
        Aguardando
      </span>

    </div>

    <div className="flex-1 h-[2px] bg-zinc-200" />

    <div className="flex flex-col items-center flex-1">

<button
  onClick={() => {
    atualizarStatus(pedidoSelecionado.id, "aceito");

    setPedidoSelecionado({
      ...pedidoSelecionado,
      status: "aceito",
    });
  }}
  className={`
    w-14
    h-14
    rounded-full
    flex
    items-center
    justify-center
    text-2xl
    cursor-pointer

    ${
      pedidoSelecionado.status === "aceito"
        ? "bg-[#6D1F2F] text-white"
        : pedidoSelecionado.status === "entrega" ||
          pedidoSelecionado.status === "concluido"
        ? "bg-green-100"
        : "bg-zinc-100"
    }
  `}
>
  👨‍🍳
</button>

      <span className="mt-3 text-sm">
        Preparo
      </span>

    </div>

    <div className="flex-1 h-[2px] bg-zinc-200" />

    <div className="flex flex-col items-center flex-1">

<button
  onClick={() => {
    atualizarStatus(pedidoSelecionado.id, "entrega");

    setPedidoSelecionado({
      ...pedidoSelecionado,
      status: "entrega",
    });
  }}
  className={`
    w-14
    h-14
    rounded-full
    flex
    items-center
    justify-center
    text-2xl
    cursor-pointer

    ${
      pedidoSelecionado.status === "entrega"
        ? "bg-[#6D1F2F] text-white"
        : pedidoSelecionado.status === "concluido"
        ? "bg-green-100"
        : "bg-zinc-100"
    }
  `}
>
  🛵
</button>

      <span className="mt-3 text-sm">
        Entrega
      </span>

    </div>

    <div className="flex-1 h-[2px] bg-zinc-200" />

    <div className="flex flex-col items-center flex-1">

 <button
  onClick={() => {
    atualizarStatus(pedidoSelecionado.id, "concluido");

    setPedidoSelecionado({
      ...pedidoSelecionado,
      status: "concluido",
    });
  }}
  className={`
    w-14
    h-14
    rounded-full
    flex
    items-center
    justify-center
    text-2xl
    cursor-pointer

    ${
      pedidoSelecionado.status === "concluido"
        ? "bg-green-600 text-white"
        : "bg-zinc-100"
    }
  `}
>
  ✔
</button>

      <span className="mt-3 text-sm">
        Entregue
      </span>

    </div>

  </div>

  <button
   
onClick={async () => {
  let novoStatus = "";

  if (pedidoSelecionado.status === "pendente") {
    novoStatus = "aceito";
  } else if (pedidoSelecionado.status === "aceito") {
    novoStatus = "entrega";
  } else if (pedidoSelecionado.status === "entrega") {
    novoStatus = "concluido";
  }

  if (!novoStatus) return;

  // Atualiza o status no banco
  await atualizarStatus(
    pedidoSelecionado.id,
    novoStatus
  );

  // Limpa o telefone
  let telefone = pedidoSelecionado.telefone.replace(/\D/g, "");

  // Evita duplicar o 55 caso já esteja salvo
  if (!telefone.startsWith("55")) {
    telefone = `55${telefone}`;
  }

  // Busca os dados do restaurante
  const restauranteId =
    localStorage.getItem("restaurante_id");

 let nomeRestaurante = "";

try {
  const { data: restaurante, error } = await supabase
    .from("restaurantes")
    .select("nome_restaurante")
    .eq("id", restauranteId)
    .single();

  if (error) {
    console.error("Erro ao buscar nome do restaurante:", error);
  }

  nomeRestaurante = restaurante?.nome_restaurante || "";
} catch (error) {
  console.error("Erro ao buscar dados do restaurante:", error);
}

  // ==========================================
  // PEDIDO ACEITO
  // ==========================================
  if (novoStatus === "aceito") {
    const mensagem =
`Olá, ${pedidoSelecionado.cliente}! 😊

Seu pedido #${pedidoSelecionado.numero_pedido ?? pedidoSelecionado.id} foi aceito${nomeRestaurante ? ` pela ${nomeRestaurante}` : ""} e já entrou em produção.

Assim que houver uma nova atualização no status do pedido, entraremos em contato por aqui.

Obrigado pela preferência!`;

    window.open(
      `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`,
      "_blank"
    );
  }

// ==========================================
// SAIU PARA ENTREGA
// ==========================================
if (novoStatus === "entrega") {
  const mensagem =
`Olá, ${pedidoSelecionado.cliente}! 🛵

Seu pedido #${pedidoSelecionado.numero_pedido ?? pedidoSelecionado.id} acabou de sair para entrega!

Já estamos a caminho do seu endereço. 📍

${nomeRestaurante
  ? `Obrigado por pedir na ${nomeRestaurante}! ❤️`
  : "Obrigado pela preferência! ❤️"}`;

  window.open(
    `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`,
    "_blank"
  );
}

  fecharPedido();
}}



    className="
      w-full
      h-14
      rounded-2xl
      mt-8
      bg-[#6D1F2F]
      hover:bg-[#531723]
      text-white
      font-bold
      transition
    "







>

    {
      pedidoSelecionado.status === "pendente"
        ? "Confirmar pedido"

      : pedidoSelecionado.status === "aceito"
        ? "Marcar como saiu para entrega"

      : pedidoSelecionado.status === "entrega"
        ? "Marcar como entregue"

      : "Pedido finalizado"
    }

  </button>

</div>

    </div>

  </div>

</div>

)}

      </div>

    </main>

  )
}