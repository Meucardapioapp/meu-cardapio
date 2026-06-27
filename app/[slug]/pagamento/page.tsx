"use client";

declare global {
  interface Window {
    Pagarme: any;
  }
}

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ShoppingCart,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Circle
} from "lucide-react";

import {
  FaPix,
  FaApplePay,
  FaGooglePay
} from "react-icons/fa6";

export default function PagamentoPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [corPrincipal, setCorPrincipal] =
  useState("");

const [logo, setLogo] =
  useState("");

console.log("SLUG:", slug);
console.log("LOGO:", logo);

  const [subtotal, setSubtotal] =
    useState(0);

  const [taxaEntrega, setTaxaEntrega] =
    useState(0);

    const [quantidadeItens, setQuantidadeItens] =
  useState(0);

  const taxaOperacional = 0.99;

  const [formaPagamento, setFormaPagamento] =
    useState("pix");

    const [nome, setNome] = useState("");

const [cpf, setCpf] = useState("");

const [whatsapp, setWhatsapp] = useState("");

const [rua, setRua] = useState("");

const [numero, setNumero] = useState("");

const [bairro, setBairro] = useState("");

const [cidade, setCidade] = useState("");

const [estado, setEstado] = useState("");

const [numeroCartao, setNumeroCartao] = useState("");
const [nomeCartao, setNomeCartao] = useState("");
const [validade, setValidade] = useState("");
const [cvv, setCvv] = useState("");
const PUBLIC_KEY =
  process.env.NEXT_PUBLIC_PAGARME_PUBLIC_KEY!;
  console.log("PUBLIC KEY:", PUBLIC_KEY);

  useEffect(() => {
    const endereco =
      localStorage.getItem(
        `endereco-${slug}`
      );

    if (endereco) {
      const dados =
        JSON.parse(endereco);

        setNome(dados.nome || "");
setCpf(dados.cpf || "");
setWhatsapp(dados.whatsapp || "");

setRua(dados.rua || "");

setNumero(dados.numero || "");

setBairro(dados.bairro || "");

setCidade(dados.cidade || "");

setEstado(dados.estado || "");

      setSubtotal(
        Number(
          dados.subtotal || 0
        )
      );

      setTaxaEntrega(
        Number(
          dados.taxaEntrega || 0
        )
      );
    }

const corSalva =
  localStorage.getItem(
    "cor-principal"
  );

console.log(
  "COR CARREGADA:",
  corSalva
);

setCorPrincipal(
  corSalva || "#571f5b"
);

const logoSalva =
  localStorage.getItem(
    "logo-restaurante"
  );

console.log(
  "LOGO CARREGADA:",
  logoSalva
);

setLogo(
  logoSalva || ""
);

const carrinho = JSON.parse(
  localStorage.getItem(
    `cart-${slug}`
  ) || "[]"
);

setQuantidadeItens(
  carrinho.reduce(
    (acc:any,item:any)=>
      acc + item.quantity,
    0
  )
);


  }, [slug]);

  const total =
    subtotal +
    taxaEntrega +
    taxaOperacional;

  function MetodoPagamento({
    id,
    titulo,
    descricao,
    icon
  }: any) {
    const ativo =
      formaPagamento === id;

    return (
      <button
        onClick={() =>
          setFormaPagamento(id)
        }
        className={`
          w-full
          bg-white
          rounded-xl
          border
          p-4
          flex
          items-center
          justify-between
          transition-all

          ${
            ativo
              ? "border-2"
              : ""
          }
        `}
        style={{
          borderColor: ativo
            ? corPrincipal
            : "#E5E7EB"
        }}
      >
        <div
  className="
    flex
    items-center
    gap-3
  "
>
  <div
    className="
      w-12
      h-12
      flex
      items-center
      justify-center
    "
  >
    {icon}
  </div>

  <div className="text-left">
    <p
      className="
        font-semibold
      "
    >
      {titulo}
    </p>

    <p
      className="
        text-xs
        text-zinc-500
      "
    >
      {descricao}
    </p>
  </div>
</div>
          
        <Circle
          size={18}
          fill={
            ativo
              ? corPrincipal
              : "white"
          }
          color={
            ativo
              ? corPrincipal
              : "#D4D4D8"
          }
        />
      </button>
    );
  }

  return (
    <main
      className="
        min-h-screen
        bg-[#F4F1EA]
        p-4
        pb-40
      "
    >
      {/* TOPO */}

      <div
        className="
          relative
          flex
          items-center
          justify-between
          mb-8
        "
      >
        <button
          onClick={() =>
            (window.location.href =
              `/${slug}/endereco`)
          }
          className="
            w-10
            h-10
            flex
            items-center
            justify-center
          "
        >
          <ArrowLeft
            size={24}
            color={corPrincipal}
          />
        </button>

    <img
    
  src={logo || "/logo.png"}
  alt="Logo"
  onError={() =>
    console.log("ERRO AO CARREGAR LOGO:", logo)
  }
  className="
    absolute
    left-1/2
    -translate-x-1/2
    w-20
    h-20
    object-cover
    rounded-full
    shadow-md
    bg-white
    border
  "
/>



        <div
          className="
            px-3
            py-2
            rounded-xl
            text-white
            flex
            items-center
            gap-2
          "
          style={{
            backgroundColor:
              corPrincipal
          }}
        >
          <ShoppingCart
            size={16}
          />
          <span>
  {quantidadeItens}
</span>
        </div>
      </div>

      {/* TITULO */}

      <h1
        className="
          text-3xl
          font-black
        "
      >
        Pagamento
      </h1>

      <p
        className="
          text-zinc-500
          mt-1
          mb-6
        "
      >
        Escolha a forma de pagamento
      </p>

      {/* FORMAS */}

      <div
        className="
          space-y-3
          mb-6
        "
      >
        <MetodoPagamento
          id="pix"
          titulo="Pix"
          descricao="Pagamento instantâneo"
          icon={
            <FaPix
  size={28}
  color="#32BCAD"
/>
          }
        />

       <MetodoPagamento
  id="credito"
  titulo="Cartão de crédito"
  descricao="Visa, Mastercard, Elo..."
  icon={
    <CreditCard
      size={22}
      color={corPrincipal}
    />
  }
/>

<MetodoPagamento
  id="debito"
  titulo="Cartão de débito"
  descricao="Visa, Mastercard, Elo..."
  icon={
    <CreditCard
      size={22}
      color={corPrincipal}
    />
  }
/>

<MetodoPagamento
  id="apple"
  titulo="Apple Pay"
  descricao=""
  icon={
    <FaApplePay
      size={34}
      color="black"
    />
  }
/>

<MetodoPagamento
  id="google"
  titulo="Google Pay"
  descricao=""
  icon={
    <FaGooglePay
      size={30}
    />
  }
/>

      
      </div>

      {/* RESUMO */}

      {(formaPagamento === "credito" ||
  formaPagamento === "debito") && (

<div
  className="
    bg-white
    rounded-2xl
    p-5
    mb-6
  "
>

  <h2 className="text-lg font-bold mb-4">
  Dados do cartão
</h2>

<input
  value={numeroCartao}
  onChange={(e) => setNumeroCartao(e.target.value)}
  placeholder="Número do cartão"
  className="w-full border rounded-xl p-3 mb-3"
/>

<input
  value={nomeCartao}
  onChange={(e) => setNomeCartao(e.target.value)}
  placeholder="Nome impresso no cartão"
  className="w-full border rounded-xl p-3 mb-3"
/>

<div className="grid grid-cols-2 gap-3">

<input
  value={validade}
  onChange={(e) => setValidade(e.target.value)}
  placeholder="MM/AA"
  className="border rounded-xl p-3"
/>

<input
  value={cvv}
  onChange={(e) => setCvv(e.target.value)}
  placeholder="CVV"
  className="border rounded-xl p-3"
/>

</div>

</div>

)}

      <div
        className="
          bg-white
          rounded-2xl
          p-5
        "
      >
        <h2
          className="
            text-lg
            font-bold
            mb-5
          "
        >
          Resumo do pedido
        </h2>

        <div
          className="
            flex
            justify-between
            mb-3
          "
        >
          <span>
            Subtotal
          </span>

          <span>
            R$ {subtotal.toFixed(2)}
          </span>
        </div>

        <div
          className="
            flex
            justify-between
            mb-3
          "
        >
          <span>
            Taxa de entrega
          </span>

          <span>
            R$ {taxaEntrega.toFixed(2)}
          </span>
        </div>

        <div
          className="
            flex
            justify-between
            mb-4
          "
        >
          <div className="flex items-center gap-2">

  <span>
    Taxa operacional
  </span>

  <span
    className="
      w-5
      h-5
      rounded-full
      bg-zinc-400
      text-white
      text-xs
      flex
      items-center
      justify-center
    "
  >
    i
  </span>

</div>

          <span>
            R$ 0,99
          </span>
        </div>

        <hr />

<div
  className="
    flex
    justify-between
    items-center
    mt-5
  "
>
  <span
    className="
      text-2xl
      font-black
      text-black
    "
  >
    Total do pedido
  </span>

  <span
    className="
      text-3xl
      font-black
    "
    style={{
      color: corPrincipal
    }}
  >
    R$ {total.toFixed(2)}
  </span>
</div>
      

        <div
          className="
            flex
            items-center
            justify-center
            gap-2
            mt-6
            text-zinc-500
            text-sm
          "
        >
          <ShieldCheck
            size={16}
          />

          Ambiente 100% seguro
        </div>
      </div>

      {/* BOTÃO */}

      <div
        className="
          fixed
          bottom-0
          left-0
          right-0
          bg-white
          border-t
          p-4
        "
      >
        <button
  onClick={async () => {

    console.log(
  "RESTAURANTE LOCALSTORAGE:",
  localStorage.getItem("restaurante_id")
);

    const pedidoResponse = await fetch(
  "/api/pedido/criar",
  {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({

      restauranteId:
        localStorage.getItem("restaurante_id"),

      nome,

      telefone: whatsapp,

      endereco: `${rua}, ${numero}`,

      bairro,

      rua,

      numero,

      observacoes: "",

      itens: JSON.parse(
        localStorage.getItem(
          `cart-${slug}`
        ) || "[]"
      ),

      subtotal,

      taxaEntrega,

      total,

      payment_method:
  formaPagamento === "credito"
    ? "credit_card"
    : formaPagamento === "debito"
    ? "debit_card"
    : "pix",
    }),
  }
);

const pedidoResultado =
  await pedidoResponse.json();

if (!pedidoResultado.success) {
  alert("Erro ao criar pedido");
  return;
}

const pedido = pedidoResultado.pedido;

console.log("PEDIDO RESULTADO:", pedidoResultado);

console.log("PEDIDO:", pedido);

console.log("PEDIDO ID:", pedido.id);

if (formaPagamento === "pix") {

  const response = await fetch(
    "/api/pagarme/criar-pix",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        total,
        restauranteId: localStorage.getItem("restaurante_id"),
        pedidoId: pedido.id,
        nome,
        cpf,
        whatsapp,
      }),
    }
  );

  const resultado = await response.json();

  console.log("PIX COMPLETO:");
console.log(resultado);

  window.location.href =
    `/${slug}/pix?id=${pedido.id}&qr=${encodeURIComponent(resultado.qrCode)}`;

  return;
}

if (
  formaPagamento === "credito" ||
  formaPagamento === "debito"
) {

  const [mes, ano] = validade.split("/");

const payload = {
  type: "card",
  card: {
    number: numeroCartao.replace(/\s/g, ""),
    holder_name: nomeCartao,
    exp_month: mes,
    exp_year: ano,
    cvv,
  },
};

console.log("PAYLOAD:", payload);

const tokenResponse = await fetch(
  `https://api.pagar.me/core/v5/tokens?appId=${PUBLIC_KEY}`,
  {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

   body: JSON.stringify(payload),
  }
);

const token = await tokenResponse.json();

console.log("STATUS:", tokenResponse.status);
console.log("TOKEN:", token);
console.log("PAYLOAD:", payload);
console.log("STATUS:", tokenResponse.status);
console.log("TOKEN:", token);

if (!token.id) {
  console.log("TOKEN COMPLETO:", token);

  alert(
    token.message ||
    JSON.stringify(token, null, 2)
  );

  return;
}

  const response = await fetch(
    "/api/pagarme/criar-pagamento",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
  total,
  restauranteId: localStorage.getItem("restaurante_id"),
  pedidoId: pedido.id,

  nome,
  cpf,
  whatsapp,

  rua,
  numero,
  bairro,
  cidade,
  estado,

  paymentMethod:
    formaPagamento === "credito"
      ? "credit_card"
      : "debit_card",

  cardToken: token.id,
}),
    }
  );

  const resultado = await response.json();

console.log(resultado);

alert(JSON.stringify(resultado, null, 2));

return;
}

if (
  formaPagamento === "apple" ||
  formaPagamento === "google"
) {
  alert("Em desenvolvimento.");
  return;
}

}}

  className="
    w-full
    h-14
    rounded-xl
    text-white
    font-bold
    shadow-lg
  "
  style={{
    backgroundColor:
      corPrincipal
  }}
>
  Finalizar pedido
</button>
      </div>
    </main>
  );
}