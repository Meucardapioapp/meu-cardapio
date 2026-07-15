"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { supabase } from "@/lib/supabase";
import { useRestaurant } from "@/contexts/RestaurantContext";
import { ArrowLeft } from "lucide-react";

export default function EnderecoPage() {

  const params = useParams();
  const slug = params.slug as string;
  const [carregandoPagamento, setCarregandoPagamento] = useState(false);
  const [lojaAberta, setLojaAberta] = useState(true);

useEffect(() => {

  async function carregarDados() {

    const carrinho =
      JSON.parse(
        localStorage.getItem(
          `cart-${slug}`
        ) || "[]"
      )

      setQuantidadeCarrinho(
  carrinho.reduce(
    (acc: number, item: any) =>
      acc + item.quantity,
    0
  )
)

    const subtotalCarrinho =
      carrinho.reduce(
        (acc: number, item: any) =>
          acc +
          Number(item.preco) *
          Number(item.quantity),
        0
      )

    setSubtotal(
      subtotalCarrinho
    )

const { data: restaurante } =
  await supabase
    .from("restaurantes")
    .select("*")
    .eq("slug", slug)
    .single()

if (!restaurante) return

setRestauranteId(restaurante.id)

const { data: aparencia } =
  await supabase
    .from("aparencia")
    .select("*")
    .eq("restaurante_id", restaurante.id)
    .single()

if (aparencia) {

  const agora = new Date()

  const dias = [
    "dom",
    "seg",
    "ter",
    "qua",
    "qui",
    "sex",
    "sab",
  ]

  const dia = dias[agora.getDay()]

  const inicio =
    aparencia[`horario_${dia}_inicio`]

  const fim =
    aparencia[`horario_${dia}_fim`]

  if (inicio && fim) {

    const [hi, mi] =
      inicio.split(":").map(Number)

    const [hf, mf] =
      fim.split(":").map(Number)

    const agoraMin =
      agora.getHours() * 60 +
      agora.getMinutes()

    const inicioMin =
      hi * 60 + mi

    const fimMin =
      hf * 60 + mf

    setLojaAberta(
      agoraMin >= inicioMin &&
      agoraMin <= fimMin
    )

  } else {

    setLojaAberta(false)

  }

}

  }
  
  carregarDados()

}, [slug])

const {
  logo,
  corPrincipal,
} = useRestaurant();

const [restauranteId, setRestauranteId] =
  useState("")

const [taxaEntrega, setTaxaEntrega] =
  useState(0)

const [subtotal, setSubtotal] =
  useState(0)

  const [quantidadeCarrinho, setQuantidadeCarrinho] =
  useState(0)

  const [cep, setCep] =
  useState("")

  const [buscaEndereco, setBuscaEndereco] =
  useState("")

const [resultadosBusca, setResultadosBusca] =
  useState<any[]>([])

const [rua, setRua] =
  useState("")

const [bairro, setBairro] =
  useState("")

const [cidade, setCidade] =
  useState("")

const [estado, setEstado] =
  useState("AM")

const [numero, setNumero] =
  useState("")

  const [whatsapp, setWhatsapp] =
  useState("")

  const [nome, setNome] =
  useState("")

const [cpf, setCpf] =
  useState("")

const [complemento, setComplemento] = useState("");
const [referencia, setReferencia] = useState("");

const [freteCalculado, setFreteCalculado] =
  useState(false)

  const [carregandoFrete, setCarregandoFrete] =
  useState(false)

useEffect(() => {
  const dados = localStorage.getItem(`endereco-${slug}`);

  if (!dados) return;

  const endereco = JSON.parse(dados);

  setNome(endereco.nome || "");
  setWhatsapp(endereco.whatsapp || "");
  setCpf(endereco.cpf || "");
 

  setCep(endereco.cep || "");
  setRua(endereco.rua || "");
  setNumero(endereco.numero || "");
  setComplemento(endereco.complemento || "");
  setReferencia(endereco.referencia || "");
  setBairro(endereco.bairro || "");
  setCidade(endereco.cidade || "");
  setEstado(endereco.estado || "AM");

  setTaxaEntrega(endereco.taxaEntrega || 0);

  if (endereco.taxaEntrega > 0) {
    setFreteCalculado(true);
  }
}, [slug]);

useEffect(() => {
  localStorage.setItem(
    `endereco-${slug}`,
    JSON.stringify({
      nome,
      whatsapp,
      cpf,


      cep,
      rua,
      numero,
      complemento,
      referencia,
      bairro,
      cidade,
      estado,

      taxaEntrega,
      subtotal,
      total: subtotal + taxaEntrega,
    })
  );
}, [
  nome,
  whatsapp,
  cpf,
  cep,
  rua,
  numero,
  complemento,
  referencia,
  bairro,
  cidade,
  estado,
  taxaEntrega,
  subtotal,
  slug,
]);


function formatarTelefone(valor: string) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);

  if (numeros.length <= 2) return numeros;

  if (numeros.length <= 7) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  }

  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}

function formatarCPF(valor: string) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);

  return numeros
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

function validarCPF(cpf: string) {
  cpf = cpf.replace(/\D/g, "");

  if (cpf.length !== 11) return false;

  if (/^(\d)\1+$/.test(cpf)) return false;

  let soma = 0;

  for (let i = 0; i < 9; i++) {
    soma += Number(cpf[i]) * (10 - i);
  }

  let resto = (soma * 10) % 11;

  if (resto === 10) resto = 0;

  if (resto !== Number(cpf[9])) return false;

  soma = 0;

  for (let i = 0; i < 10; i++) {
    soma += Number(cpf[i]) * (11 - i);
  }

  resto = (soma * 10) % 11;

  if (resto === 10) resto = 0;

  return resto === Number(cpf[10]);
}

async function buscarCEP() {

  if (!cep) return

  const response =
    await fetch(
      `https://viacep.com.br/ws/${cep.replace(/\D/g, "")}/json`
    )

  const data =
    await response.json()

  setRua(
    data.logradouro || ""
  )

  setBairro(
    data.bairro || ""
  )

  setCidade(
    data.localidade || ""
  )

  setEstado(
    data.uf || ""
  )
}


async function buscarEndereco(texto: string) {

  setBuscaEndereco(texto);

  if (texto.trim().length < 3) {

    setResultadosBusca([]);

    return;

  }

  try {

    const response = await fetch(
      `/api/autocomplete?search=${encodeURIComponent(texto)}`
    );

    const data = await response.json();

    setResultadosBusca(data);

  } catch (error) {

    console.error(error);

    setResultadosBusca([]);

  }

}


async function calcularFrete() {

  setCarregandoFrete(true)

if (
  !nome ||
  !cpf ||
  !whatsapp ||
  !restauranteId ||
  !rua ||
  !numero ||
  !bairro ||
  !cidade
) {

  setCarregandoFrete(false)

  alert("Preencha todos os campos.")

  return
}

  try {

    const response =
      await fetch(
        "/api/calcular-frete",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            restauranteId,
            rua,
            numero,
            bairro,
            cidade,
            estado,
          }),
        }
      )

   const data = await response.json()

console.log("STATUS:", response.status)
console.log("RESPOSTA:", data)

setCarregandoFrete(false)

if (!response.ok) {
  alert(data.error || "Erro ao calcular frete")
  return
}

if (!data.faixaFrete) {
  console.log("Não veio faixaFrete:", data)
  alert("Nenhuma faixa encontrada.")
  return
}

setTaxaEntrega(Number(data.faixaFrete.valor))

setFreteCalculado(true)

  } catch (error) {

    console.error(error)
    setCarregandoFrete(false)

  }
}

function resetarFrete() {

  setFreteCalculado(false)

  setTaxaEntrega(0)

}

async function usarMinhaLocalizacao() {

  if (!navigator.geolocation) {

    alert("Seu navegador não suporta localização.");

    return;

  }

  navigator.geolocation.getCurrentPosition(

    async (position) => {

      try {

        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        const response = await fetch(

          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`

        );

        const data = await response.json();

setCep(data.address.postcode || "");

setRua(data.address.road || "");

// O cliente informa o número manualmente
setNumero("");

setBairro(
  data.address.suburb ||
  data.address.neighbourhood ||
  data.address.city_district ||
  ""
);

setCidade(
  data.address.city ||
  data.address.town ||
  data.address.village ||
  ""
);

setEstado(
  data.address.state ||
  "AM"
);



      } catch {

        alert("Não foi possível localizar seu endereço.");

      }

    },

    () => {

      alert("Permita o acesso à localização.");

    }

  );

}

  return (

    <main
      className="
        min-h-screen
        bg-white
        p-4
        pb-36
      "
    >

      {/* TOPO */}

      <div
        className="
          relative
          flex
          items-center
          justify-between
          mb-4
        "
      >

<button
  onClick={() => {
    window.location.href = `/${slug}/carrinho`;
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

        <div
          className="
            absolute
            left-1/2
            -translate-x-1/2
            flex
            flex-col
            items-center
          "
        >

          <img
            src={logo}
            alt="Logo"
            className="
              w-20
              h-20
              rounded-full
              object-cover
              border
              border-white
              shadow-md
            "
          />

        </div>

        <div
          className="
            px-3
            h-10
            rounded-xl
            flex
            items-center
            gap-2
            text-white
            font-bold
          "
          style={{
            backgroundColor:
              corPrincipal,
          }}
        >
          <ShoppingCart size={16} />
          <span>
{quantidadeCarrinho}
</span>
        </div>

      </div>

      {/* TITULO */}

      <h1
        className="
          text-3xl
          font-black
          mb-6
        "
      >
        Endereço de entrega
      </h1>


      {/* NOVO ENDEREÇO */}

      <h2
  className="
    font-bold
    text-lg
    mb-4
  "
>
  Informações do cliente
</h2>

<div
  className="
    bg-white
    rounded-xl
    border
    p-4
    mb-4
  "
>

  <p
    className="
      text-xs
      font-semibold
      mb-2
      text-zinc-600
    "
  >
    Nome e Sobrenome
  </p>

  <input
    value={nome}
    onChange={(e) =>
      setNome(e.target.value)
    }
    placeholder="Ex.: João da Silva"
    className="
      w-full
      outline-none
      font-semibold
    "
  />

</div>

 <div
  className="
    bg-white
    rounded-xl
    border
    p-4
  "
>

  <div
    className="
      flex
      items-center
      justify-between
    "
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
    w-10
    h-10
    rounded-full
    bg-green-100
    flex
    items-center
    justify-center
  "
>
  <FaWhatsapp
    size={22}
    className="text-green-600"
  />
</div>

      <div>

        <input
          value={whatsapp}
onChange={(e) =>
  setWhatsapp(
    formatarTelefone(e.target.value)
  )
}
inputMode="tel"
autoComplete="tel"
          placeholder="(92) 99999-9999"
          className="
            outline-none
            font-semibold
          "
        />

        <p
          className="
            text-xs
            text-zinc-500
          "
        >
          Para avisos sobre seu pedido
        </p>

      </div>

    </div>

    {
      whatsapp.length >= 15 && (

        <div
          className="
            w-6
            h-6
            rounded-full
            bg-green-500
            text-white
            flex
            items-center
            justify-center
            text-xs
            font-bold
          "
        >
          ✓
        </div>

      )
    }

  </div>

</div>

     
<div className="space-y-4">

<div
  className="
    bg-white
    rounded-xl
    border
    p-4
    mt-4
  "
>

  <div
    className="
      flex
      items-center
      justify-between
    "
  >

    <div className="flex-1">

      <p
        className="
          text-xs
          font-semibold
          mb-2
          text-zinc-600
        "
      >
        CPF
      </p>

      <input
        value={cpf}
        onChange={(e) =>
          setCpf(
            formatarCPF(e.target.value)
          )
        }
        inputMode="numeric"
        autoComplete="off"
        placeholder="000.000.000-00"
        className="
          w-full
          outline-none
          font-semibold
        "
      />

    </div>

    {cpf.length === 14 && (

      validarCPF(cpf) ? (

        <div
          className="
            ml-3
            w-6
            h-6
            rounded-full
            bg-green-500
            text-white
            flex
            items-center
            justify-center
            text-xs
            font-bold
          "
        >
          ✓
        </div>

      ) : (

        <div
          className="
            ml-3
            w-6
            h-6
            rounded-full
            bg-red-500
            text-white
            flex
            items-center
            justify-center
            text-xs
            font-bold
          "
        >
          ✕
        </div>

      )

    )}

  </div>

</div>


<h2
  className="
    font-bold
    text-lg
    mt-6
    mb-4
  "
>
  Endereço de entrega
</h2>


<div>

<p
className="
text-xs
font-semibold
mb-1
text-zinc-700
"
>
Buscar endereço
</p>

<input

value={buscaEndereco}

onChange={(e)=>
buscarEndereco(e.target.value)
}

placeholder="Digite sua rua..."

className="
w-full
bg-white
rounded-xl
border
p-4
"

/>

</div>


{resultadosBusca.length > 0 && (

<div
className="
bg-white
border
rounded-xl
overflow-hidden
shadow-lg
mt-2
"
>

{resultadosBusca.map((item,index)=>(

<button

key={index}

type="button"

className="
w-full
text-left
p-4
hover:bg-zinc-100
border-b
"

onClick={()=>{

setBuscaEndereco("");

setRua(item.properties.street || "");

setNumero("");

setBairro(
  item.properties.suburb ||
  item.properties.district ||
  ""
);

setCidade(
  item.properties.city ||
  ""
);

setEstado(
  item.properties.state_code ||
  ""
);

setCep(
  item.properties.postcode ||
  ""
);

setResultadosBusca([]);

}}

>

{item.properties.formatted}

</button>

))}

</div>

)}

  {/* RUA */}

  <div>

    <p className="text-xs font-semibold mb-1">
      Rua
    </p>

    <input
      value={rua}
      readOnly
      onChange={(e) => {
        setRua(e.target.value)
        resetarFrete()
      }}
      className="
        w-full
        bg-white
        rounded-xl
        border
        p-4
      "
    />

  </div>

  {/* NUMERO + COMPLEMENTO */}

  <div
    className="
      grid
      grid-cols-2
      gap-3
    "
  >

    <div>

      <p className="text-xs font-semibold mb-1">
        Número
      </p>

<input
  value={numero}
  onChange={(e) => {

    setNumero(e.target.value);

    resetarFrete();

    if (e.target.value.trim().length > 0) {

    }

  }}
        className="
          w-full
          bg-white
          rounded-xl
          border
          p-4
        "
      />

    </div>

    <div>

      <p className="text-xs font-semibold mb-1">
        Complemento (opcional)
      </p>

<input
  value={complemento}
  onChange={(e) => setComplemento(e.target.value)}
  placeholder="Apto 101"
  className="
    w-full
    bg-white
    rounded-xl
    border
    p-4
  "
/>

    </div>

  </div>

  {/* BAIRRO + CIDADE */}

  <div
    className="
      grid
      grid-cols-2
      gap-3
    "
  >

    <div>

      <p className="text-xs font-semibold mb-1">
        Bairro
      </p>

      <input
        value={bairro}
        onChange={(e) => {
          setBairro(e.target.value)
          resetarFrete()
        }}
        className="
          w-full
          bg-white
          rounded-xl
          border
          p-4
        "
      />

    </div>

    <div>

      <p className="text-xs font-semibold mb-1">
        Cidade
      </p>

      <input
        value={cidade}
        onChange={(e) => {
          setCidade(e.target.value)
          resetarFrete()
        }}
        className="
          w-full
          bg-white
          rounded-xl
          border
          p-4
        "
      />

    </div>

  </div>

  {/* REFERENCIA */}

  <div>

    <p className="text-xs font-semibold mb-1">
      Referência (opcional)
    </p>

<input
  value={referencia}
  onChange={(e) =>
    setReferencia(e.target.value)
  }
  placeholder="Ex: Próximo ao Shopping"
  className="
    w-full
    bg-white
    rounded-xl
    border
    p-4
  "
/>

  </div>

</div>

<button
  onClick={calcularFrete}
  className="
    w-full
    h-14
    rounded-xl
    text-white
    font-bold
    mt-5

    transition-all
    duration-200

    hover:scale-[1.01]
    active:scale-[0.97]

    shadow-md
    hover:shadow-lg
  "
  style={{
    backgroundColor:
      corPrincipal,
  }}
>


{
carregandoFrete
  ? "Calculando..."

: freteCalculado
  ? "✓ Entrega calculada"

: "Calcular entrega"
}

</button>

      {/* ENTREGA */}

      {
freteCalculado && (
<div
  className="
    mt-6
          bg-[#F7F1FF]
          rounded-xl
          p-4
          flex
          justify-between
        "
      >

        <div>

          <p
            className="
              text-sm
              text-zinc-500
            "
          >
            Entrega
          </p>

          <p
            className="
              font-bold
            "
          >
            30-50 min
          </p>

        </div>

        <div>

          <p
            className="
              text-sm
              text-zinc-500
            "
          >
            Taxa
          </p>

          <p
            className="
              font-bold
              text-green-600
            "
          >
            R$ {
taxaEntrega.toFixed(2)
}
          </p>

        </div>

      </div>
)
}

      {/* RODAPÉ FIXO */}

<div
  className="
    fixed
    bottom-0
    left-0
    right-0
    p-4
    shadow-2xl
  "
  style={{
    backgroundColor: corPrincipal,
  }}
>

        <div
          className="
            flex
            items-center
            justify-between
          "
        >

          <div>

<p
  className="
    text-sm
    text-white/80
  "
>
  Total parcial
</p>

<p
  className="
    text-2xl
    font-black
    text-white
  "
>
              R$ {
(
subtotal +
taxaEntrega
).toFixed(2)
}
            </p>

          </div>

<button
  disabled={!freteCalculado || carregandoPagamento}


onClick={() => {

  if (!lojaAberta) {

    alert(
      "O restaurante está fechado e não está recebendo pedidos."
    );

    return;

  }

  if (carregandoPagamento) return;

  if (!validarCPF(cpf)) {

      alert("Informe um CPF válido.");
      return;
    }

    setCarregandoPagamento(true);

    localStorage.setItem(
      `endereco-${slug}`,
      JSON.stringify({
        nome,
        whatsapp,
        cpf,

        cep,
        rua,
        numero,
        complemento,
        referencia,
        bairro,
        cidade,
        estado,

        taxaEntrega,
        subtotal,
        total: subtotal + taxaEntrega,
      })
    );

    setTimeout(() => {
      window.location.href = `/${slug}/pagamento`;
    }, 250);

  }}

  className={`
    px-6
    py-4
    rounded-xl
    font-bold
    text-white
    transition-all
    duration-200
    active:scale-95
    disabled:opacity-80
    disabled:cursor-not-allowed
    min-w-[280px]
    flex
    items-center
    justify-center
    gap-3
    ${
      freteCalculado
        ? "bg-green-600"
        : "bg-zinc-300"
    }
  `}
>
  {carregandoPagamento ? (
    <>
      <div
        className="
          w-5
          h-5
          border-2
          border-white/40
          border-t-white
          rounded-full
          animate-spin
        "
      />
      Carregando...
    </>
  ) : (
    "Continuar para pagamento"
  )}
</button>

        </div>

      </div>

    </main>

  );
}