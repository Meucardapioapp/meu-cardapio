"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ShoppingCart } from "lucide-react";
import { useRestaurant } from "@/contexts/RestaurantContext";
import { ArrowLeft } from "lucide-react";

export default function CarrinhoPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [cart, setCart] = useState<any[]>([]);
  const [tipoPedido, setTipoPedido] =
  useState<"entrega" | "retirada">("entrega");

const [nomeRetirada, setNomeRetirada] =
  useState("");

const [cpfRetirada, setCpfRetirada] =
  useState("");

const [telefoneRetirada, setTelefoneRetirada] =
  useState("");

  function formatarCPF(valor: string) {
  return valor
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    .slice(0, 14);
}

function formatarTelefone(valor: string) {
  return valor
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .slice(0, 15);
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

const cpfValido = validarCPF(cpfRetirada);

const telefoneValido =
  telefoneRetirada.replace(/\D/g, "").length === 11;

const {
  logo,
  corPrincipal,
  setLogo,
  setCorPrincipal,
} = useRestaurant();

  const [restauranteNome, setRestauranteNome] =
  useState("");

  const [ruaRestaurante, setRuaRestaurante] =
  useState("");

  const [pedidoMinimo, setPedidoMinimo] =
  useState(0);

const [numeroRestaurante, setNumeroRestaurante] =
  useState("");

const [bairroRestaurante, setBairroRestaurante] =
  useState("");

const [cidadeRestaurante, setCidadeRestaurante] =
  useState("");

const [estadoRestaurante, setEstadoRestaurante] =
  useState("");

const [totalItens, setTotalItens] =
  useState(0);

const [sugestoes, setSugestoes] =
  useState<any[]>([]);

  const [carregando, setCarregando] = useState(false);

  const [alerta, setAlerta] = useState<{
  titulo: string;
  mensagem: string;
} | null>(null);

  const [lojaAberta, setLojaAberta] = useState(true);

  useEffect(() => {
  async function carregarDados() {

    const cartStorage =
      localStorage.getItem(
        `cart-${slug}`
      );

    if (cartStorage) {
      const itens =
        JSON.parse(cartStorage);

      setCart(itens);

      setTotalItens(
        itens.reduce(
          (acc: number, item: any) =>
            acc + item.quantity,
          0
        )
      );
    }

    const { data: restaurante } =
      await supabase
        .from("restaurantes")
        .select("*")
        .eq("slug", slug)
        .single();

        const { data: aparencia } =
  await supabase
    .from("aparencia")
    .select("*")
    .eq("restaurante_id", restaurante.id)
    .single();

if (aparencia) {

  const agora = new Date();

  const dias = [
    "dom",
    "seg",
    "ter",
    "qua",
    "qui",
    "sex",
    "sab",
  ];

  const dia = dias[agora.getDay()];

  const inicio =
    aparencia[`horario_${dia}_inicio`];

  const fim =
    aparencia[`horario_${dia}_fim`];

  if (inicio && fim) {

    const [hi, mi] =
      inicio.split(":").map(Number);

    const [hf, mf] =
      fim.split(":").map(Number);

    const agoraMin =
      agora.getHours() * 60 +
      agora.getMinutes();

    const inicioMin =
      hi * 60 + mi;

    const fimMin =
      hf * 60 + mf;

    setLojaAberta(
      agoraMin >= inicioMin &&
      agoraMin <= fimMin
    );

  } else {

    setLojaAberta(false);

  }

}

    if (!restaurante) return;

setRestauranteNome(restaurante.nome);

setRuaRestaurante(restaurante.endereco || "");

setNumeroRestaurante(restaurante.numero || "");

setBairroRestaurante(restaurante.bairro || "");

setCidadeRestaurante(restaurante.cidade || "");

setEstadoRestaurante(restaurante.estado || "");


const minimo = Number(aparencia?.pedido_minimo || 0);

console.log("Pedido mínimo:", minimo);

setPedidoMinimo(minimo);

    const { data: produtos } =
  await supabase
    .from("produtos")
    .select("*")
    .eq(
      "restaurante_id",
      restaurante.id
    );

if (produtos) {

  const sugestoesFiltradas =
    produtos.filter((produto) => {

      const categoria =
        (
          produto.categoria || ""
        ).toLowerCase();

      return (
        categoria.includes(
          "bebida"
        ) ||
        categoria.includes(
          "sobremesa"
        )
      );
    });

  setSugestoes(
    sugestoesFiltradas.slice(
      0,
      3
    )
  );
}
  }

  carregarDados();

}, [slug]);

 function salvarCarrinho(
  novoCarrinho: any[]
) {
  setCart(novoCarrinho);

  setTotalItens(
    novoCarrinho.reduce(
      (acc, item) =>
        acc + item.quantity,
      0
    )
  );

  localStorage.setItem(
    `cart-${slug}`,
    JSON.stringify(novoCarrinho)
  );
}

  function increaseQuantity(
    uniqueId: string
  ) {
    const novoCarrinho = cart.map(
      (item) =>
        item.uniqueId === uniqueId
          ? {
              ...item,
              quantity:
                item.quantity + 1,
            }
          : item
    );

    salvarCarrinho(novoCarrinho);
  }

  function decreaseQuantity(
    uniqueId: string
  ) {
    const novoCarrinho = cart
      .map((item) =>
        item.uniqueId === uniqueId
          ? {
              ...item,
              quantity:
                item.quantity - 1,
            }
          : item
      )
      .filter(
        (item) => item.quantity > 0
      );

    salvarCarrinho(novoCarrinho);
  }

  function removeItem(
    uniqueId: string
  ) {
    const novoCarrinho = cart.filter(
      (item) =>
        item.uniqueId !== uniqueId
    );

    salvarCarrinho(novoCarrinho);
  }

  function adicionarSugestao(
  produto: any
) {

  const itemExistente =
    cart.find(
      (item) =>
        item.id === produto.id
    );

  if (itemExistente) {

    const novoCarrinho =
      cart.map((item) =>
        item.id === produto.id
          ? {
              ...item,
              quantity:
                item.quantity + 1,
            }
          : item
      );

    salvarCarrinho(
      novoCarrinho
    );

    return;
  }

  const novoItem = {
    ...produto,
    quantity: 1,
    uniqueId:
      crypto.randomUUID(),
  };

  salvarCarrinho([
    ...cart,
    novoItem,
  ]);
}

  const total = cart.reduce(
    (acc, item) =>
      acc +
      Number(item.preco) *
        Number(item.quantity),
    0
  );

  console.log({
  total,
  pedidoMinimo,
  bloqueado: total < pedidoMinimo,
});

return (
  <>
    {alerta && (
      <div
        className="
          fixed inset-0 z-[9999]
          bg-black/50
          backdrop-blur-[2px]
          flex items-center justify-center
          px-5
        "
      >
        <div
          className="
            w-full max-w-[380px]
            bg-white
            rounded-3xl
            shadow-2xl
            overflow-hidden
          "
        >
          {/* Barra na cor do restaurante */}
          <div
            className="h-2 w-full"
            style={{
              backgroundColor: corPrincipal,
            }}
          />

          <div className="px-7 pt-8 pb-7 text-center">

            {/* Ícone */}
            <div
              className="
                w-16 h-16
                rounded-full
                mx-auto mb-5
                flex items-center justify-center
              "
              style={{
                backgroundColor: `${corPrincipal}15`,
                color: corPrincipal,
              }}
            >
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line
                  x1="12"
                  y1="16"
                  x2="12.01"
                  y2="16"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-black text-zinc-900">
              {alerta.titulo}
            </h2>

            <p className="mt-3 text-[15px] leading-6 text-zinc-500">
              {alerta.mensagem}
            </p>

            <button
              type="button"
              onClick={() => setAlerta(null)}
              className="
                w-full mt-7
                py-4
                rounded-2xl
                text-white
                font-bold
                text-base
                active:scale-[0.98]
                transition
              "
              style={{
                backgroundColor: corPrincipal,
              }}
            >
              Entendi
            </button>

          </div>
        </div>
      </div>
    )}

    <main
      className="
      min-h-screen
      bg-white
      p-4
      pb-32
    "
    >
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
    window.location.href = `/${slug}`;
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
    -top-2
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
    w-16
    h-16
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
    flex
    flex-col
    items-center
  "
>

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
    backgroundColor: corPrincipal,
  }}
>
  <ShoppingCart size={16} />

  <span>
      {totalItens}
  </span>
</div>

</div>
      </div>

<div
  className="
    flex
    items-center
    justify-between
    mb-8
  "
>
  <h1
    className="
      text-3xl
      font-black
    "
  >
    Meu carrinho
  </h1>

  <span
    className="
      text-sm
      font-semibold
    "
    style={{
      color: corPrincipal,
    }}
  >
    {totalItens} itens
  </span>
</div>

      {cart.map((item) => (
        <div
          key={item.uniqueId}
          className="
            bg-white
            rounded-xl
            p-4
            mb-4
            shadow-sm
          "
        >
          <div className="flex gap-4">
            <img
              src={item.imagem}
              alt={item.nome}
              className="
                w-28
                h-28
                rounded-xl
                object-cover
              "
            />

            <div className="flex-1">
              <h2
                className="
                  font-bold
                  text-lg
                "
              >
                {item.nome}
              </h2>

<p
  className="
    text-zinc-800
    text-xs
    line-clamp-2
  "
>
  {item.descricao}
</p>

              <p
                className="
                  mt-2
                  font-black
                  text-xl
                "
              >
                R${" "}
                {Number(
                  item.preco
                ).toFixed(2)}
              </p>

              <div
                className="
                  flex
                  items-center
                  justify-between
                  mt-4
                "
              >
                <button
                  onClick={() =>
                    removeItem(
                      item.uniqueId
                    )
                  }
                  className="
                    text-red-500
                    text-sm
                    font-semibold
                  "
                >
                  Remover
                </button>

                <div
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >
                  <button
                    onClick={() =>
                      decreaseQuantity(
                        item.uniqueId
                      )
                    }
                    className="
                      w-8
                      h-8
                      rounded-lg
                      border
                    "
                  >
                    -
                  </button>

                  <span className="font-bold">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() =>
                      increaseQuantity(
                        item.uniqueId
                      )
                    }
className="
  w-8
  h-8
  rounded-lg
  text-white
"
style={{
  backgroundColor: corPrincipal,
}}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div
        className="
          bg-white
          rounded-xl
          p-4
          mt-4
          cursor-pointer
        "
        onClick={() => {
          window.location.href = `/${slug}`;
        }}
      >
        <div
          className="
            flex
            justify-between
            items-center
          "
        >
<span
  className="
    font-bold
  "
  style={{
    color: corPrincipal,
  }}
>
            + Adicionar mais itens
          </span>

          <span
  className="
    text-2xl
    font-light
  "
>
  ›
</span>
        </div>
      </div>

<h2
  className="
    text-xl
    font-black
    mt-6
    mb-4
  "
>
  Complete seu pedido
</h2>

<div
  className="
    flex
    gap-3
    overflow-x-auto
    pb-2
    mb-6
  "
>
  {sugestoes.map((produto) => (

    <div
      key={produto.id}
      className="
        bg-white
        border
        border-zinc-100
        rounded-2xl
        p-3
        relative
        min-w-[160px]
        h-[250px]
      "
    >

      <div
        className="
          flex
          justify-center
          mb-3
        "
      >
<div
  className="
    w-28
    h-28
    rounded-full
    overflow-hidden
    mx-auto
    bg-white
    flex
    items-center
    justify-center
  "
>

<img
  src={produto.imagem}
  alt={produto.nome}
  className="
    w-full
    h-full
    object-cover
    object-center
  "
/>

</div>
      </div>

      <button
  onClick={() =>
    adicionarSugestao(
      produto
    )
  }
        className="
          absolute
          right-3
          top-24
          w-10
          h-10
          rounded-full
          bg-white
          shadow-md
          text-3xl
          flex
          items-center
          justify-center
        "
        style={{
          color: corPrincipal,
        }}
      >
        +
      </button>

     <p
  className="
    text-sm
    font-semibold
    leading-5
    h-[48px]
    overflow-hidden
  "
>
        {produto.nome}
      </p>

      <p
        className="
          text-sm
          text-zinc-800
          mt-2
        "
      >
        R$ {Number(produto.preco).toFixed(2)}
      </p>

    </div>

  ))}
</div>


<div className="bg-white rounded-2xl p-5 mb-6 shadow-sm">

  <h2 className="text-lg font-black mb-5">
    Como deseja receber seu pedido?
  </h2>

  <div className="space-y-3">

    <button
      onClick={() => setTipoPedido("entrega")}
      className={`w-full rounded-2xl border p-4 text-left transition-all ${
        tipoPedido === "entrega"
          ? "border-red-700 bg-red-50"
          : "border-zinc-200"
      }`}
    >
      <p className="font-bold">
        🚴 Entrega
      </p>

      <p className="text-sm text-zinc-500 mt-1">
        Receba o pedido no seu endereço.
      </p>
    </button>

    <button
      onClick={() => setTipoPedido("retirada")}
      className={`w-full rounded-2xl border p-4 text-left transition-all ${
        tipoPedido === "retirada"
          ? "border-red-700 bg-red-50"
          : "border-zinc-200"
      }`}
    >
      <p className="font-bold">
        🏪 Retirar no local
      </p>

      <p className="text-sm text-zinc-500 mt-1">
        Retire seu pedido diretamente no local.
      </p>
    </button>

  </div>

</div>

{tipoPedido === "retirada" && (

  <div className="mt-5 border-t pt-5">

    <div className="bg-zinc-50 rounded-xl p-4 mb-5">

      <p className="font-bold">
        📍 Endereço para retirada
      </p>

      <p className="text-sm text-zinc-600 mt-2">
        {restauranteNome}
      </p>

 <p className="text-sm text-zinc-600">
  {ruaRestaurante}
  {numeroRestaurante
    ? `, Nº ${numeroRestaurante}`
    : ""}
</p>

<p className="text-sm text-zinc-600">
  {bairroRestaurante}
</p>

<p className="text-sm text-zinc-600">
  {cidadeRestaurante} - {estadoRestaurante}
</p>

    </div>

    <div className="space-y-4">

      <input
        value={nomeRetirada}
        onChange={(e)=>setNomeRetirada(e.target.value)}
        placeholder="Seu nome"
        className="w-full border rounded-xl p-4"
      />

<div className="relative">

  <input
    value={cpfRetirada}
    onChange={(e) =>
      setCpfRetirada(
        formatarCPF(e.target.value)
      )
    }
    placeholder="CPF"
    inputMode="numeric"
    className="w-full border rounded-xl p-4 pr-12"
  />

  {cpfRetirada !== "" && (
    <div
      className={`
        absolute
        right-4
        top-1/2
        -translate-y-1/2
        w-3
        h-3
        rounded-full
        ${
          cpfValido
            ? "bg-green-500"
            : "bg-red-500"
        }
      `}
    />
  )}

</div>

<div className="relative">

  <input
    value={telefoneRetirada}
    onChange={(e) =>
      setTelefoneRetirada(
        formatarTelefone(e.target.value)
      )
    }
    placeholder="Telefone"
    inputMode="tel"
    className="w-full border rounded-xl p-4 pr-12"
  />

  {telefoneRetirada !== "" && (
    <div
      className={`
        absolute
        right-4
        top-1/2
        -translate-y-1/2
        w-3
        h-3
        rounded-full
        ${
          telefoneValido
            ? "bg-green-500"
            : "bg-red-500"
        }
      `}
    />
  )}

</div>

    </div>

  </div>

)}







<div
  className="
    fixed
    bottom-0
    left-0
    right-0
    p-4
  "
  style={{
    backgroundColor: corPrincipal,
  }}
      >


<div className="space-y-3">

  {total < pedidoMinimo && (

    <div
      className="
        bg-white/15
        rounded-xl
        px-4
        py-3
      "
    >
      <p className="text-white text-sm">

        Faltam{" "}

        <span className="font-bold">
          R$ {(pedidoMinimo - total).toFixed(2)}
        </span>

        {" "}para atingir o pedido mínimo de{" "}

        <span className="font-bold">
          R$ {pedidoMinimo.toFixed(2)}
        </span>

      </p>

    </div>

  )}

  <div
    className="
      flex
      items-center
      justify-between
      gap-4
    "
  >

    <div>

      <p className="text-sm text-white/80">
        Subtotal
      </p>

      <p className="text-3xl font-black text-white">
        R$ {total.toFixed(2)}
      </p>

    </div>

    <button
      disabled={
        carregando ||
        total < pedidoMinimo
      }
      onClick={() => {

        if (!lojaAberta) {

          alert(
            "O restaurante está fechado e não está recebendo pedidos."
          );

          return;

        }

        if (total < pedidoMinimo) {

          alert(
            `O pedido mínimo é de R$ ${pedidoMinimo.toFixed(2)}.`
          );

          return;

        }

if (tipoPedido === "retirada") {

 if (!nomeRetirada.trim()) {
  setAlerta({
    titulo: "Informe seu nome",
    mensagem:
      "Preencha seu nome para continuar com o pedido.",
  });
  return;
}

if (!cpfValido) {
  setAlerta({
    titulo: "CPF inválido",
    mensagem:
      "Informe um CPF válido para continuar.",
  });
  return;
}

if (!telefoneValido) {
  setAlerta({
    titulo: "Telefone obrigatório",
    mensagem:
      "Informe um telefone válido com DDD para continuar.",
  });
  return;
}

}

        setCarregando(true);

        setTimeout(() => {

          localStorage.setItem(
            "tipoPedido",
            tipoPedido
          );

          if (tipoPedido === "retirada") {

            localStorage.setItem(
              "dadosRetirada",
              JSON.stringify({
                nome: nomeRetirada,
                cpf: cpfRetirada,
                telefone: telefoneRetirada,
              })
            );

            window.location.href = `/${slug}/pagamento`;

          } else {

            window.location.href = `/${slug}/endereco`;

          }

        }, 250);

      }}

      className="
        bg-[#16A34A]
        text-white
        px-6
        py-4
        rounded-xl
        font-bold
        min-w-[190px]
        transition-all
        disabled:opacity-80
      "
    >
      {carregando ? "Carregando..." : "Continuar"}
    </button>

  </div>

</div>

      </div>
    </main>
  </>
  );
}