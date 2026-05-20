"use client"

import { useEffect, useState } from "react"
import { supabase } from "../utils/supabase/client"

type Additional = {
  nome: string
  preco: number
}

type Item = {
  name: string
  price: number
  quantity: number
  observation?: string
  additionals?: Additional[]
}

type Order = {
  id: number
  customer_name: string
  customer_phone: string
  total: number
  status: string
  created_at: string
  items: Item[]
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([])

  async function fetchOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")

  console.log("DATA:", data)
  console.log("ERROR:", error)

  if (data) {
    setOrders(data)
  }
}

  useEffect(() => {
    fetchOrders()

    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          fetchOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function updateStatus(id: number, status: string) {
    await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)

    fetchOrders()
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "Preparando":
        return "bg-blue-500"

      case "Saiu para entrega":
        return "bg-purple-500"

      case "Concluído":
        return "bg-green-500"

      default:
        return "bg-yellow-500"
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">

      <div className="max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-10">

          <div>

            <h1 className="text-5xl font-bold">
              Painel de Pedidos
            </h1>

            <p className="text-zinc-400 mt-2">
              Pedidos em tempo real
            </p>

          </div>

          <div className="bg-green-500/20 border border-green-500 px-5 py-3 rounded-2xl">

            <span className="text-green-400 font-bold">
              {orders.length} pedidos
            </span>

          </div>

        </div>

        {orders.length === 0 ? (

          <div className="bg-zinc-900 rounded-3xl p-20 text-center text-zinc-500">
            Nenhum pedido encontrado.
          </div>

        ) : (

          <div className="grid xl:grid-cols-2 gap-6">

            {orders.map((order) => (

              <div
                key={order.id}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6"
              >

                <div className="flex items-start justify-between mb-6">

                  <div>

                    <h2 className="text-3xl font-bold">
                      Pedido #{order.id}
                    </h2>

                    <p className="text-zinc-400 mt-1">
                      {order.customer_name}
                    </p>

                    <p className="text-zinc-500 text-sm mt-1">
                      {order.customer_phone}
                    </p>

                  </div>

                  <div
                    className={`${getStatusColor(order.status)} px-4 py-2 rounded-xl font-bold`}
                  >
                    {order.status}
                  </div>

                </div>

                <div className="space-y-4 mb-8">

                  {order.items?.map((item, index) => (

                    <div
                      key={index}
                      className="bg-zinc-800 rounded-2xl p-4"
                    >

                      <div className="flex items-center justify-between mb-3">

                        <div>

                          <h3 className="text-xl font-bold">
                            {item.name}
                          </h3>

                          <p className="text-zinc-400">
                            Quantidade: {item.quantity}
                          </p>

                        </div>

                        <span className="text-green-400 font-bold text-lg">
                          R$ {Number(item.price).toFixed(2)}
                        </span>

                      </div>

                      {item.additionals &&
                        item.additionals.length > 0 && (

                          <div className="mt-4">

                            <p className="text-zinc-300 font-semibold mb-2">
                              Adicionais
                            </p>

                            <div className="space-y-2">

                              {item.additionals.map((add, i) => (

                                <div
                                  key={i}
                                  className="flex items-center justify-between bg-zinc-700 px-3 py-2 rounded-xl"
                                >

                                  <span>
                                    {add.nome}
                                  </span>

                                  <span className="text-green-400 font-bold">
                                    + R$ {Number(add.preco).toFixed(2)}
                                  </span>

                                </div>

                              ))}

                            </div>

                          </div>

                        )}

                      {item.observation && (

                        <div className="mt-4 bg-zinc-700 rounded-2xl p-4">

                          <p className="text-yellow-400 font-semibold mb-1">
                            Observação
                          </p>

                          <p className="text-zinc-200">
                            {item.observation}
                          </p>

                        </div>

                      )}

                    </div>

                  ))}

                </div>

                <div className="flex items-center justify-between mb-8">

                  <div>

                    <p className="text-zinc-400 mb-1">
                      Total
                    </p>

                    <h3 className="text-4xl font-bold text-green-400">
                      R$ {Number(order.total).toFixed(2)}
                    </h3>

                  </div>

                  <div className="text-right">

                    <p className="text-zinc-500 text-sm">
                      {new Date(order.created_at).toLocaleDateString("pt-BR")}
                    </p>

                    <p className="text-zinc-500 text-sm">
                      {new Date(order.created_at).toLocaleTimeString("pt-BR")}
                    </p>

                  </div>

                </div>

                <div className="grid grid-cols-2 gap-3">

                  <button
                    onClick={() =>
                      updateStatus(order.id, "Preparando")
                    }
                    className="bg-blue-500 hover:bg-blue-600 transition py-3 rounded-2xl font-bold"
                  >
                    Preparando
                  </button>

                  <button
                    onClick={() =>
                      updateStatus(order.id, "Saiu para entrega")
                    }
                    className="bg-purple-500 hover:bg-purple-600 transition py-3 rounded-2xl font-bold"
                  >
                    Entrega
                  </button>

                  <button
                    onClick={() =>
                      updateStatus(order.id, "Concluído")
                    }
                    className="bg-green-500 hover:bg-green-600 transition py-3 rounded-2xl font-bold col-span-2"
                  >
                    Concluir Pedido
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </main>
  )
}