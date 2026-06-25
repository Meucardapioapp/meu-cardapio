"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Check,
  Clock3,
  MapPin,
  CreditCard,
} from "lucide-react";

export default function PedidoAprovadoPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [pedido, setPedido] = useState<any>(null);

  const [corPrincipal, setCorPrincipal] =
    useState("#6D1F2F");

  const [logo, setLogo] =
    useState("");

  useEffect(() => {
    const pedidoSalvo =
      localStorage.getItem(
        `pedido-${slug}`
      );

    if (pedidoSalvo) {
      setPedido(
        JSON.parse(pedidoSalvo)
      );
    }

    const cor =
      localStorage.getItem(
        "cor-principal"
      );

    if (cor) {
      setCorPrincipal(cor);
    }

    const logoSalva =
      localStorage.getItem(
        "logo-restaurante"
      );

    if (logoSalva) {
      setLogo(logoSalva);
    }
  }, [slug]);

  if (!pedido) {
    return null;
  }

  function nomePagamento() {
    switch (pedido.formaPagamento) {
      case "pix":
        return "Pix";

      case "credito":
        return "Cartão de Crédito";

      case "debito":
        return "Cartão de Débito";

      case "apple":
        return "Apple Pay";

      case "google":
        return "Google Pay";

      default:
        return "Pix";
    }
  }

  return (
    <main
      className="
      min-h-screen
      bg-[#F4F1EA]
      p-5
      "
    >
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
            #{Date.now()
              .toString()
              .slice(-5)}
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
                {
                  pedido.previsaoEntrega
                }
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

              <p
                className="
                font-semibold
                "
              >
                {pedido.endereco.rua},{" "}
                {
                  pedido.endereco
                    .numero
                }
              </p>

              <p>
                {
                  pedido.endereco
                    .bairro
                }
                {" - "}
                {
                  pedido.endereco
                    .cidade
                }
                /
                {
                  pedido.endereco
                    .estado
                }
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
      `/${slug}/acompanhar-pedido`
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