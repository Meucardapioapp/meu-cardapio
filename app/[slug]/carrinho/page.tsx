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

const {
  logo,
  corPrincipal,
  setLogo,
  setCorPrincipal,
} = useRestaurant();

  const [restauranteNome, setRestauranteNome] =
  useState("");

const [totalItens, setTotalItens] =
  useState(0);

const [sugestoes, setSugestoes] =
  useState<any[]>([]);

  const [carregando, setCarregando] = useState(false);


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

    if (!restaurante) return;

setRestauranteNome(restaurante.nome);

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

  return (
    <main
      className="
      min-h-screen
      bg-[#F4F1EA]
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
    bg-zinc-100
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
    text-white
  "
>
  Subtotal ({totalItens} itens)
</p>

<p
  className="
    text-2xl
    font-black
    text-white
  "
>
              R$ {total.toFixed(2)}
            </p>
          </div>

<button
  disabled={carregando}
  onClick={() => {

    if (carregando) return;

    setCarregando(true);

    setTimeout(() => {
      window.location.href = `/${slug}/endereco`;
    }, 250);

  }}
  className="
    bg-[#16A34A]
    text-white
    px-6
    py-4
    rounded-xl
    font-bold
    transition-all
    duration-200
    active:scale-95
    disabled:opacity-80
    disabled:cursor-not-allowed
    min-w-[210px]
    flex
    items-center
    justify-center
    gap-3
  "
>
  {carregando ? (
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
    "Continuar"
  )}
</button>
        </div>
      </div>
    </main>
  );
}