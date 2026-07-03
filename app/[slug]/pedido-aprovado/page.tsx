"use client";

import { useEffect, useState } from "react";
import {
  useParams,
  useSearchParams,
} from "next/navigation";

import {
  ArrowLeft,
  Check,
  Clock3,
  MapPin,
  CreditCard,
} from "lucide-react";

import { useRestaurant } from "@/contexts/RestaurantContext";

export default function PedidoAprovadoPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const pedidoId =
  searchParams.get("id");

  const [pedido, setPedido] = useState<any>(null);

const {
  logo,
  corPrincipal,
} = useRestaurant();

  useEffect(() => {
  async function carregarPedido() {
    if (!pedidoId) return;

    const response = await fetch(
      `/api/pedido?id=${pedidoId}`
    );

    const data = await response.json();

console.log("API PEDIDO:", data);

if (data.success) {
  console.log("PEDIDO RECEBIDO:", data.pedido);
  setPedido(data.pedido);
}

  }

  carregarPedido();
}, [pedidoId]);

  if (!pedido) {
    return null;
  }

function nomePagamento() {
  switch (pedido.payment_method) {
    case "pix":
      return "Pix";

    case "credit_card":
      return "Cartão de Crédito";

    case "cash":
      return "Dinheiro";

    case "google_pay":
      return "Google Pay";

    case "apple_pay":
      return "Apple Pay";

    default:
      return pedido.payment_method || "-";
  }
}

  return (
  <main
    className="
      relative
      min-h-screen
      bg-[#F4F1EA]
      p-5
    "
  >

<div className="absolute top-6 left-6 z-10">
  <button
    onClick={() => history.back()}
    className="
      w-12
      h-12
      rounded-full
      bg-white
      shadow-md
      flex
      items-center
      justify-center
      transition-all
      duration-200
      hover:scale-105
      active:scale-95
    "
  >
    <ArrowLeft
      size={24}
      style={{ color: corPrincipal }}
    />
  </button>
</div>

      <div
        className="
        max-w-md
        mx-auto
        "
      >
        {/* LOGO */}

        {logo && (
          <div
            className="
            flex
            justify-center
            mb-6
            "
          >
            <img
              src={logo}
              alt="Logo"
              className="
              w-24
              h-24
              rounded-full
              object-cover
              shadow-md
              bg-white
              "
            />
          </div>
        )}

        {/* SUCESSO */}

        <div
          className="
          bg-white
          rounded-3xl
          p-6
          shadow-sm
          text-center
          "
        >
          <div
            className="
            w-24
            h-24
            rounded-full
            mx-auto
            flex
            items-center
            justify-center
            text-white
            mb-5
            "
            style={{
              backgroundColor:
                corPrincipal,
            }}
          >
            <Check size={50} />
          </div>

          <h1
            className="
            text-4xl
            font-black
            mb-2
            "
          >
            Pedido confirmado!
          </h1>

          <p
            className="
            text-zinc-500
            "
          >
            Seu pedido foi recebido
            com sucesso.
          </p>

          <div
            className="
            mt-5
            inline-flex
            px-5
            py-3
            rounded-xl
            font-black
            text-xl
            "
            style={{
              backgroundColor:
                `${corPrincipal}20`,
              color:
                corPrincipal,
            }}
          >
           #{pedido.id} 
          </div>
        </div>

        {/* CARD INFO */}

        <div
          className="
          bg-white
          rounded-3xl
          p-6
          mt-6
          shadow-sm
          "
        >
          {/* ENTREGA */}

          <div
            className="
            flex
            gap-4
            pb-5
            border-b
            "
          >
            <div
              className="
              w-12
              h-12
              rounded-xl
              flex
              items-center
              justify-center
              "
              style={{
                backgroundColor:
                  `${corPrincipal}15`,
              }}
            >
              <Clock3
                color={
                  corPrincipal
                }
              />
            </div>

            <div>
              <p
                className="
                text-zinc-500
                "
              >
                Previsão de entrega
              </p>

              <p
  className="
    font-bold
    text-xl
  "
>
  Em preparação
</p>
            </div>
          </div>

          {/* ENDEREÇO */}

          <div
            className="
            flex
            gap-4
            py-5
            border-b
            "
          >
            <div
              className="
              w-12
              h-12
              rounded-xl
              flex
              items-center
              justify-center
              "
              style={{
                backgroundColor:
                  `${corPrincipal}15`,
              }}
            >
              <MapPin
                color={
                  corPrincipal
                }
              />
            </div>

            <div>
              <p
                className="
                text-zinc-500
                "
              >
                Endereço de entrega
              </p>

              <p className="font-semibold">
  {pedido.rua || "-"}, {pedido.numero || "-"}
</p>

<p>
  {pedido.bairro || "-"}
</p>
            </div>
          </div>

          {/* PAGAMENTO */}

          <div
            className="
            flex
            gap-4
            py-5
            border-b
            "
          >
            <div
              className="
              w-12
              h-12
              rounded-xl
              flex
              items-center
              justify-center
              "
              style={{
                backgroundColor:
                  `${corPrincipal}15`,
              }}
            >
              <CreditCard
                color={
                  corPrincipal
                }
              />
            </div>

            <div>
              <p
                className="
                text-zinc-500
                "
              >
                Pagamento
              </p>

              <p
                className="
                font-semibold
                "
              >
                {nomePagamento()}
              </p>
            </div>
          </div>

          {/* TOTAL */}

          <div
            className="
            flex
            justify-between
            items-center
            pt-5
            "
          >
            <p
              className="
              text-zinc-500
              font-semibold
              "
            >
              Total do pedido
            </p>

            <p
              className="
              text-4xl
              font-black
              "
              style={{
                color:
                  corPrincipal,
              }}
            >
              R${" "}
              {Number(
                pedido.total
              ).toFixed(2)}
            </p>
          </div>
        </div>

        {/* INFO */}

        <div
          className="
          bg-green-50
          rounded-2xl
          p-4
          mt-5
          text-center
          text-green-700
          "
        >
          Você pode acompanhar
          seu pedido em tempo
          real na próxima tela.
        </div>

        {/* BOTÕES */}

       {/* BOTÕES */}

<button
  onClick={() => {
  window.location.href =
    `/${slug}/acompanhar-pedido?id=${pedido.id}`;
}}
  className="
    w-full
    h-14
    rounded-xl
    text-white
    font-bold
    mt-5
  "
  style={{
    backgroundColor:
      corPrincipal,
  }}
>
  Acompanhar pedido
</button>

<button
  onClick={() => {
    window.location.href =
      `/${slug}`
  }}
  className="
    w-full
    mt-4
    font-semibold
  "
  style={{
    color:
      corPrincipal,
  }}
>
  Voltar para o início
</button>
      </div>
    </main>
  );
}