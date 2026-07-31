"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  ArrowLeft,
  Clock,
  MapPin,
  CreditCard,
  ShoppingBag,
  CheckCircle2,
  Bike,
  Store
} from "lucide-react";

interface ItemPedido {
  id?: string;
  nome: string;
  quantidade: number;
  preco: number;
  imagem?: string;
  adicionais?: any[];
  observacao?: string;
}

interface Pedido {
  id: number;
  numero_pedido: number;
  status: string;

  subtotal: number;
  taxa_entrega: number;
  taxa_operacional: number;
  total_pago: number;

  payment_method: string;

  observacoes?: string;

  retirada_no_local: boolean;

  tipo_pedido: string;

  created_at: string;
}

export default function PedidoPage() {

  const router = useRouter();

  const params = useParams();

  const [loading, setLoading] = useState(true);

  const [pedido, setPedido] = useState<Pedido | null>(null);

  const [cliente, setCliente] = useState<any>(null);

  const [endereco, setEndereco] = useState<any>(null);

  const [itens, setItens] = useState<ItemPedido[]>([]);

  useEffect(() => {

    async function carregarPedido() {

      try {

        const response = await fetch(
          `/api/pedido/${params.id}`
        );

        const resultado = await response.json();

        if (!resultado.success) {

          router.back();

          return;

        }

        setPedido(resultado.pedido);

        setCliente(resultado.cliente);

        setEndereco(resultado.endereco);

        setItens(resultado.itens || []);

      } catch (err) {

        console.error(err);

      }

      setLoading(false);

    }

    carregarPedido();

  }, [params.id, router]);

  function traduzirStatus(status: string) {
  switch ((status || "").toLowerCase()) {
    case "pending":
      return "Aguardando pagamento";

    case "paid":
      return "Pagamento aprovado";

    case "preparing":
      return "Em preparo";

    case "ready":
      return "Pronto";

    case "delivery":
      return "Saiu para entrega";

    case "delivered":
      return "Entregue";

    case "cancelled":
      return "Cancelado";

    default:
      return status;
  }
}

async function pedirNovamente() {
  try {
    alert("Em breve você poderá repetir este pedido.");
  } catch (err) {
    console.error(err);
  }
}

  if (loading) {

function traduzirStatus(status: string) {
  switch ((status || "").toLowerCase()) {
    case "pending":
      return "Aguardando pagamento";

    case "paid":
      return "Pagamento aprovado";

    case "preparing":
      return "Em preparo";

    case "ready":
      return "Pronto";

    case "delivery":
      return "Saiu para entrega";

    case "delivered":
      return "Entregue";

    case "cancelled":
      return "Cancelado";

    default:
      return status;
  }
}

async function pedirNovamente() {
  try {
    alert("Em breve você poderá repetir este pedido.");
  } catch (err) {
    console.error(err);
  }
}

    return (

      <div className="min-h-screen flex items-center justify-center">

        Carregando pedido...

      </div>

    );

  }

  if (!pedido) return null;

  return (
  <div className="min-h-screen bg-zinc-100">

    <div className="sticky top-0 z-50 bg-white border-b">

      <div className="max-w-lg mx-auto h-16 flex items-center justify-between px-4">

        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="text-center">

          <p className="text-xs text-zinc-500">
            Pedido
          </p>

          <h1 className="font-black text-lg">
            #{pedido.numero_pedido || pedido.id}
          </h1>

        </div>

        <div className="w-10" />

      </div>

    </div>

    <div className="max-w-lg mx-auto px-4 py-6">

      <div className="bg-white rounded-3xl p-6 shadow-sm">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-sm text-zinc-500">
              Status
            </p>

            <h2 className="text-2xl font-black mt-1">
               {traduzirStatus(pedido.status)}
            </h2>

          </div>

{pedido.status === "cancelled" ? (
  <Clock size={34} className="text-red-500" />
) : (
  <CheckCircle2
    size={34}
    className="text-green-500"
  />
)}

        </div>

        <div className="grid grid-cols-2 gap-4 mt-8">

          <div>

            <p className="text-xs text-zinc-500">
              Data
            </p>

            <p className="font-semibold mt-1">

              {new Date(
                pedido.created_at
              ).toLocaleDateString(
                "pt-BR"
              )}

            </p>

          </div>

          <div>

            <p className="text-xs text-zinc-500">
              Hora
            </p>

            <p className="font-semibold mt-1">

              {new Date(
                pedido.created_at
              ).toLocaleTimeString(
                "pt-BR",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}

            </p>

          </div>

        </div>

      </div>

            {/* ===========================
            ITENS DO PEDIDO
      =========================== */}

      <div className="mt-6">

        <div className="flex items-center gap-2 mb-4">

          <ShoppingBag size={20} />

          <h2 className="text-xl font-black">
            Itens do pedido
          </h2>

        </div>

        <div className="space-y-4">

          {itens.map((item, index) => (

            <div
              key={index}
              className="bg-white rounded-3xl p-5 shadow-sm"
            >

              <div className="flex gap-4">

                {item.imagem ? (

                  <img
                    src={item.imagem}
                    alt={item.nome}
                    className="w-20 h-20 rounded-2xl object-cover"
                  />

                ) : (

                  <div
                    className="
                      w-20
                      h-20
                      rounded-2xl
                      bg-zinc-100
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <ShoppingBag size={28} />
                  </div>

                )}

                <div className="flex-1">

                  <div className="flex justify-between">

                    <h3 className="font-bold text-lg">
                      {item.quantidade}x {item.nome}
                    </h3>

                    <span className="font-black">

                      R$ {Number(item.preco).toFixed(2)}

                    </span>

                  </div>

                  {item.adicionais &&
                    item.adicionais.length > 0 && (

                      <div className="mt-3">

                        <p className="text-sm font-semibold text-zinc-500 mb-2">
                          Adicionais
                        </p>

                        <div className="space-y-1">

                          {item.adicionais.map(
                            (adicional: any, i: number) => (

                              <div
                                key={i}
                                className="flex justify-between text-sm"
                              >

                                <span>

                                  + {adicional.nome}

                                </span>

                                <span>

                                  R$ {Number(adicional.preco || 0).toFixed(2)}

                                </span>

                              </div>

                            )
                          )}

                        </div>

                      </div>

                    )}

                  {item.observacao && (

                    <div
                      className="
                        mt-4
                        bg-zinc-100
                        rounded-2xl
                        p-3
                      "
                    >

                      <p className="text-xs text-zinc-500">
                        Observação
                      </p>

                      <p className="mt-1">

                        {item.observacao}

                      </p>

                    </div>

                  )}

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

            {/* ===========================
            RESUMO DO PEDIDO
      =========================== */}

      <div className="mt-6">

        <div className="flex items-center gap-2 mb-4">

          <CreditCard size={20} />

          <h2 className="text-xl font-black">
            Resumo do pedido
          </h2>

        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm space-y-4">

          <div className="flex justify-between">

            <span className="text-zinc-600">
              Subtotal
            </span>

            <strong>

              R$ {Number(pedido.subtotal || 0).toFixed(2)}

            </strong>

          </div>

          <div className="flex justify-between">

            <span className="text-zinc-600">
              Taxa de entrega
            </span>

            <strong>

              R$ {Number(pedido.taxa_entrega || 0).toFixed(2)}

            </strong>

          </div>

          <div className="flex justify-between">

            <span className="text-zinc-600">
              Taxa operacional
            </span>

            <strong>

              R$ {Number(pedido.taxa_operacional || 0).toFixed(2)}

            </strong>

          </div>

          <div className="border-t pt-4 flex justify-between">

            <span className="text-lg font-bold">
              Total pago
            </span>

            <span className="text-2xl font-black">

              R$ {Number(pedido.total_pago || 0).toFixed(2)}

            </span>

          </div>

        </div>

      </div>

      {/* ===========================
            ENTREGA
      =========================== */}

      <div className="mt-6">

        <div className="flex items-center gap-2 mb-4">

          {pedido.retirada_no_local ? (
            <Store size={20} />
          ) : (
            <Bike size={20} />
          )}

          <h2 className="text-xl font-black">

            {pedido.retirada_no_local
              ? "Retirada no local"
              : "Entrega"}

          </h2>

        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm">

          {!pedido.retirada_no_local && endereco ? (

            <>

              <div className="flex gap-3">

                <MapPin
                  className="text-red-500 mt-1"
                  size={20}
                />

                <div>

                  <p className="font-bold">

                    {endereco.apelido || "Endereço"}

                  </p>

                  <p className="text-zinc-600 mt-2">

                    {endereco.rua}, {endereco.numero}

                  </p>

                  <p className="text-zinc-600">

                    {endereco.bairro}

                  </p>

                  <p className="text-zinc-600">

                    {endereco.cidade} - {endereco.estado}

                  </p>

                </div>

              </div>

            </>

          ) : (

            <p className="text-zinc-600">

              Este pedido foi marcado para retirada no local.

            </p>

          )}

        </div>

      </div>

            {/* ===========================
            PAGAMENTO
      =========================== */}

      <div className="mt-6">

        <div className="flex items-center gap-2 mb-4">

          <CreditCard size={20} />

          <h2 className="text-xl font-black">
            Pagamento
          </h2>

        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm">

          <div className="flex justify-between items-center">

            <span className="text-zinc-500">
              Forma de pagamento
            </span>

            <strong>

              {pedido.payment_method || "Não informado"}

            </strong>

          </div>

        </div>

      </div>

      {/* ===========================
            CLIENTE
      =========================== */}

      <div className="mt-6">

        <div className="flex items-center gap-2 mb-4">

          <ShoppingBag size={20} />

          <h2 className="text-xl font-black">
            Cliente
          </h2>

        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm">

          <p className="font-bold">

            {cliente?.nome}

          </p>

          <p className="text-zinc-500 mt-2">

            {cliente?.telefone}

          </p>

          {cliente?.email && (

            <p className="text-zinc-500">

              {cliente.email}

            </p>

          )}

        </div>

      </div>

      {/* ===========================
            OBSERVAÇÃO
      =========================== */}

      {pedido.observacoes && (

        <div className="mt-6">

          <h2 className="text-xl font-black mb-4">
            Observações
          </h2>

          <div className="bg-white rounded-3xl p-6 shadow-sm">

            <p>

              {pedido.observacoes}

            </p>

          </div>

        </div>

      )}

            {/* ===========================
            AÇÕES
      =========================== */}

      <div className="h-32" />

    </div>

    <div className="fixed bottom-0 left-0 right-0 bg-white border-t">

      <div className="max-w-lg mx-auto p-4 flex gap-3">

        <button
          onClick={() => router.back()}
          className="flex-1 h-14 rounded-2xl border border-zinc-300 font-semibold"
        >
          Voltar
        </button>

        <button
          className="flex-[2] h-14 rounded-2xl bg-[#6D1F2F] text-white font-bold hover:bg-[#531723] transition"
onClick={pedirNovamente}
        >
          Pedir novamente
        </button>

      </div>

    </div>

  </div>
);
}

