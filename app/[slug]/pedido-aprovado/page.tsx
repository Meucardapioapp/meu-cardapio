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

const [carregandoAcompanhar, setCarregandoAcompanhar] =
  useState(false);

const [carregandoInicio, setCarregandoInicio] =
  useState(false);

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

useEffect(() => {
  if (!pedidoId) return;

  const intervalo = setInterval(async () => {
    const response = await fetch(`/api/pedido?id=${pedidoId}`);
    const data = await response.json();

    if (data.success) {
      setPedido(data.pedido);
    }
  }, 5000);

  return () => clearInterval(intervalo);
}, [pedidoId]);

useEffect(() => {
  if (!pedido?.id) return;

  const chave = `meta_purchase_${pedido.id}`;

  if (sessionStorage.getItem(chave)) {
    return;
  }

  const valor = Number(
    pedido.total_pago ?? pedido.total ?? 0
  );

  if (
    typeof window !== "undefined" &&
    typeof (window as any).fbq === "function"
  ) {
    (window as any).fbq("track", "Purchase", {
      value: valor,
      currency: "BRL",
      content_type: "product",
      order_id: String(pedido.id),
    });

    sessionStorage.setItem(chave, "1");

    console.log("META PURCHASE:", {
      pedido: pedido.id,
      value: valor,
      currency: "BRL",
    });
  }
}, [pedido]);

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

      case "card_delivery":
        return "Cartão";

    case "google_pay":
      return "Google Pay";

    case "apple_pay":
      return "Apple Pay";

    default:
      return pedido.payment_method || "-";
  }
}

function etapaAtual() {
  switch (pedido.status) {
    case "pendente":
      return 1;

    case "aceito":
      return 2;

    case "entrega":
      return 3;

    case "concluido":
      return 4;

    default:
      return 1;
  }
}

  return (
  <main
    className="
      relative
      min-h-screen
      bg-white
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
           #{pedido.numero_pedido ?? pedido.id} 
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
          
{/* STATUS */}

<div className="pb-6 border-b">

  <p className="font-bold text-lg mb-6">
    Status do pedido
  </p>

  <div className="flex">

    {[
      {
        titulo: "Recebido",
        status: "pendente",
        icon: "🧾",
      },
      {
        titulo: "Preparo",
        status: "aceito",
        icon: "👨‍🍳",
      },
      {
        titulo: "Entrega",
        status: "entrega",
        icon: "🛵",
      },
      {
        titulo: "Entregue",
        status: "concluido",
        icon: "✓",
      },
    ].map((item, index) => {

      const ativo = etapaAtual() >= index + 1;

      return (

        <div
          key={item.status}
          className="flex-1 flex flex-col items-center relative"
        >

          {index !== 0 && (
            <div
              className="absolute top-5 left-0 w-1/2 h-1"
              style={{
                backgroundColor:
                  ativo
                    ? corPrincipal
                    : "#E5E7EB",
              }}
            />
          )}

          {index !== 3 && (
            <div
              className="absolute top-5 right-0 w-1/2 h-1"
              style={{
                backgroundColor:
                  etapaAtual() > index + 1
                    ? corPrincipal
                    : "#E5E7EB",
              }}
            />
          )}

          <div
            className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
            style={{
              backgroundColor:
                ativo
                  ? corPrincipal
                  : "#E5E7EB",
              color:
                ativo
                  ? "#fff"
                  : "#666",
            }}
          >
            {item.icon}
          </div>

          <span className="text-xs text-center mt-2 font-semibold">
            {item.titulo}
          </span>

        </div>

      );

    })}

  </div>

</div>

         {/* ENDEREÇO / MODALIDADE */}

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
      backgroundColor: `${corPrincipal}15`,
    }}
  >
    <MapPin color={corPrincipal} />
  </div>

  <div>

    {pedido.tipo_pedido === "retirada" ? (

      <>
        <p className="text-zinc-500">
          Modalidade
        </p>

        <p className="font-semibold">
          🛍️ Retirada no local
        </p>
      </>

    ) : (

      <>
        <p className="text-zinc-500">
          Endereço de entrega
        </p>

        <p className="font-semibold">
          {pedido.rua}, {pedido.numero}
        </p>

        <p>
          {pedido.bairro}
        </p>
      </>

    )}

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
                pedido.total_pago ?? pedido.total
              ).toFixed(2)}
            </p>
          </div>
        </div>


        {/* BOTÕES */}

       {/* BOTÕES */}


<button
onClick={() => {





const telefone =
  pedido.telefone_restaurante.replace(/\D/g, "");

const mensagem = `Olá!

Gostaria de falar sobre meu pedido.

Pedido: #${pedido.numero_pedido ?? pedido.id}
Cliente: ${pedido.cliente}`;

window.open(
  `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`,
  "_blank"
);





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
    backgroundColor: corPrincipal,
  }}
>
  Falar com o restaurante no WhatsApp
</button>



<button
  disabled={carregandoInicio}
  onClick={() => {

if (carregandoInicio) return;

setCarregandoInicio(true);

    setTimeout(() => {
      window.location.href =
        `/${slug}`;
    }, 300);

  }}
className="
w-full
h-14
mt-4
rounded-xl
border-2
font-bold
transition-all
active:scale-95
"
style={{
  color: corPrincipal,
  borderColor: corPrincipal,
}}

>
  {carregandoInicio ? (
    <>
      <div
        className="
          w-5
          h-5
          border-2
          border-zinc-400
          border-t-black
          rounded-full
          animate-spin
        "
      />
      Carregando...
    </>
  ) : (
    "Fazer um novo pedido"
  )}
</button>
      </div>
    </main>
  );
}