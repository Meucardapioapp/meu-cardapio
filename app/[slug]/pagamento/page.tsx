"use client";

declare global {
  interface Window {
    Pagarme: any;
  }
}
import creditCardType from "credit-card-type";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRestaurant } from "@/contexts/RestaurantContext";
import {
  ShoppingCart,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Circle,
  Banknote
} from "lucide-react";

import {
  FaPix,
  FaApplePay,
  FaGooglePay
} from "react-icons/fa6";

import GooglePayButton from "@google-pay/button-react";

export default function PagamentoPage() {
  const params = useParams();
  const slug = params.slug as string;

const {
  logo,
  corPrincipal,
} = useRestaurant();

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

    const [aceitaDinheiro, setAceitaDinheiro] =
  useState(false);

    const [nome, setNome] = useState("");

const [cpf, setCpf] = useState("");

const [whatsapp, setWhatsapp] = useState("");

const [rua, setRua] = useState("");

const [numero, setNumero] = useState("");

const [bairro, setBairro] = useState("");

const [cidade, setCidade] = useState("");

const [estado, setEstado] = useState("");
const [email, setEmail] = useState("");
const [cep, setCep] = useState("");
const [complemento, setComplemento] = useState("");

const [numeroCartao, setNumeroCartao] = useState("");
const [nomeCartao, setNomeCartao] = useState("");
const [validade, setValidade] = useState("");
const [cvv, setCvv] = useState("");
const [bandeira, setBandeira] = useState("");

const [googlePayToken, setGooglePayToken] = useState<any>(null);

const [googlePayPronto, setGooglePayPronto] = useState(false);

const bandeiras: Record<string, string> = {
  visa: "/bandeiras/visa.svg/visa.png",
  mastercard: "/bandeiras/mastercard.svg/mastercard.png",
  elo: "/bandeiras/elo.svg/elo.png",
  hipercard: "/bandeiras/hipercard.svg/hipercard.png",
  amex: "/bandeiras/amex.svg/amex.png",
};

const PUBLIC_KEY =
  process.env.NEXT_PUBLIC_PAGARME_PUBLIC_KEY!;
  console.log("PUBLIC KEY:", PUBLIC_KEY);

  useEffect(() => {

  async function carregarConfiguracaoPagamento() {

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

setEmail(dados.email || "");

setCep(dados.cep || "");

setComplemento(dados.complemento || "");

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

const restauranteId =
  localStorage.getItem("restaurante_id");

console.log("RESTAURANTE ID:", restauranteId);

if (restauranteId) {

  const url =
  `/api/configuracoes-pagamento?restauranteId=${restauranteId}`;

console.log("URL:", url);

const response = await fetch(url);

 const config = await response.json();

console.log("CONFIG:", config);

  setAceitaDinheiro(
    config?.dinheiro ?? false
  );
  console.log("CONFIG PAGAMENTO:", config);
console.log("ACEITA DINHEIRO:", config?.dinheiro);

}

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

}

carregarConfiguracaoPagamento();

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
  onClick={() => {
    window.location.href = `/${slug}/endereco`;
  }}
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
    hover:scale-105
    active:scale-95
  "
>
  <ArrowLeft
    size={24}
    style={{
      color: corPrincipal,
    }}
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

{aceitaDinheiro && (

<MetodoPagamento
  id="dinheiro"
  titulo="Dinheiro"
  descricao="Pagamento na entrega"
  icon={
    <Banknote
      size={22}
      color="#16A34A"
    />
  }
/>

)}

      
      </div>

      {/* RESUMO */}

 {formaPagamento === "credito" && (

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

<div className="relative mb-3">

  <input
    value={numeroCartao}
    onChange={(e) => {

      const valor = e.target.value
        .replace(/\D/g, "")
        .slice(0, 16)
        .replace(/(.{4})/g, "$1 ")
        .trim();

      setNumeroCartao(valor);

const numero = valor.replace(/\s/g, "");

if (numero.length < 4) {
  setBandeira("");
  return;
}

const resultado = creditCardType(numero);

if (resultado.length > 0) {
  setBandeira(resultado[0].type);
} else {
  setBandeira("");
}

    }}

    inputMode="numeric"
    autoComplete="cc-number"

    placeholder="Número do cartão"

    className="
      w-full
      border
      rounded-xl
      p-3
      pr-16
      text-lg
      tracking-wider
      focus:outline-none
      focus:ring-2
      focus:ring-[#6D1F2F]
    "
  />

  {bandeira && bandeiras[bandeira] && (
    <img
      src={bandeiras[bandeira]}
      alt={bandeira}
className="
absolute
right-4
top-1/2
-translate-y-1/2
w-10
h-6
object-contain
border
bg-red-200
"
/>
  )}

</div>
 

<input
  value={nomeCartao}
  onChange={(e) => setNomeCartao(e.target.value)}
  placeholder="Nome impresso no cartão"
  className="w-full border rounded-xl p-3 mb-3"
/>

<div className="grid grid-cols-2 gap-3">

<input
  value={validade}
  onChange={(e) => {

  let valor = e.target.value
    .replace(/\D/g, "")
    .slice(0, 4);

  if (valor.length > 2) {
    valor =
      valor.slice(0, 2) +
      "/" +
      valor.slice(2);
  }

  setValidade(valor);

}}

  inputMode="numeric"
  autoComplete="cc-exp"

  placeholder="MM/AA"
  className="border rounded-xl p-3"
/>

<input
  value={cvv}
  onChange={(e) =>

  setCvv(

    e.target.value
      .replace(/\D/g, "")
      .slice(0, 4)

  )

}

  inputMode="numeric"
  autoComplete="cc-csc"

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

<span
  className="
    text-sm
    text-zinc-500
    font-medium
  "
>
  Taxa operacional
</span>

<span
  className="
    w-4
    h-4
    rounded-full
    bg-zinc-300
    text-white
    text-[10px]
    flex
    items-center
    justify-center
    font-semibold
  "
>
  i
</span>

</div>

<span className="text-sm text-zinc-500">
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
  : formaPagamento === "dinheiro"
  ? "cash"
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

const itens = JSON.parse(
  localStorage.getItem(`cart-${slug}`) || "[]"
);

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

if (formaPagamento === "credito") {

  const [mes, ano] = validade.split("/");

const payload = {
  type: "card",

  card: {
    number: numeroCartao.replace(/\s/g, ""),
    holder_name: nomeCartao,
    exp_month: mes,
    exp_year: `20${ano}`,
    cvv,
  },

billing: {
  address: {
    line_1: `${rua}, ${numero}`,
    line_2: complemento
      ? `${complemento} - ${bairro}`
      : bairro,
    zip_code: cep.replace(/\D/g, ""),
      city: cidade,
      state: estado,
      country: "BR",
    },
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

console.log("DADOS ENVIADOS PARA PAGAR.ME", {
  nome,
  email,
  cpf,
  whatsapp,
  cep,
  rua,
  numero,
  complemento,
  bairro,
  cidade,
  estado,
});

const itens = JSON.parse(
  localStorage.getItem(`cart-${slug}`) || "[]"
);

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
  email,
  cpf,
  whatsapp,

  rua,
  numero,
  complemento,
  bairro,
  cidade,
  estado,
  cep,

  itens,

  paymentMethod: "credit_card",

  cardToken: token.id,
}),
    }
  );

const resultado = await response.json();

console.log("PAGAMENTO:", resultado);

if (
  resultado.charges?.[0]?.status === "paid" ||
  resultado.charges?.[0]?.status === "captured"
) {
  window.location.href =
    `/${slug}/pedido-aprovado?id=${pedido.id}`;

  return;
}

alert(
  resultado.message ||
  "Pagamento recusado."
);

}

if (formaPagamento === "google") {

  if (!googlePayToken) {
    alert("Primeiro conclua o Google Pay.");
    return;
  }

console.log("DADOS ENVIADOS PARA PAGAR.ME", {
  nome,
  email,
  cpf,
  whatsapp,
  cep,
  rua,
  numero,
  complemento,
  bairro,
  cidade,
  estado,
});

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
email,
cpf,
whatsapp,

rua,
numero,
complemento,
bairro,
cidade,
estado,
cep,

itens,

        paymentMethod: "google_pay",
        googlePayToken,
      }),
    }
  );

  const resultado = await response.json();

console.log(resultado);

if (
  resultado.charges?.[0]?.status === "paid" ||
  resultado.charges?.[0]?.status === "captured"
) {
  window.location.href =
    `/${slug}/pedido-aprovado?id=${pedido.id}`;

  return;
}

alert(
  resultado.message ||
  "Pagamento recusado."
);
}

if (formaPagamento === "dinheiro") {

  await fetch("/api/pedido/atualizar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pedidoId: pedido.id,
      payment_status: "pending",
      payment_method: "cash",
      status: "pendente",
    }),
  });

  window.location.href =
    `/${slug}/pedido-aprovado?id=${pedido.id}`;

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