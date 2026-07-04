"use client"

export const dynamic = "force-dynamic"

import {
  useEffect,
  useState,
  useRef,
} from "react"

import { useParams } from "next/navigation"
import { useRestaurant } from "@/contexts/RestaurantContext";

import Header from "../components/Header"
import Benefits from "../components/Benefits"
import ProductCard from "../components/ProductCard"
import FeaturedProductCard from "../components/FeaturedProductCard";
import ProductModal from "../components/ProductModal"
import Cart from "../components/Cart"
import CheckoutModal from "../components/CheckoutModal"
import BottomNavigation from "../components/BottomNavigation";
import RestaurantFooter from "../components/RestaurantFooter";

import { supabase } from "@/lib/supabase"

import type {
  Adicional,
  ProdutoFormatado,
  CartItem
} from "../types"

export default function CardapioPage() {

const params = useParams()

const slug = params.slug as string

const {
  logo,
  corPrincipal,
} = useRestaurant();

console.log("SLUG ATUAL:", slug)

useEffect(() => {
  localStorage.setItem(
    "cardapio-slug",
    slug
  )
}, [slug])

  const [produtos, setProdutos] =
    useState<ProdutoFormatado[]>([])

    const [produtosCarregados, setProdutosCarregados] =
  useState(false);

  const [selectedProduct, setSelectedProduct] =
    useState<ProdutoFormatado | null>(null)

  const [openModal, setOpenModal] =
    useState(false)

  const [
    openCheckout,
    setOpenCheckout,
  ] = useState(false)

  const [cart, setCart] =
    useState<CartItem[]>([])

    const [carregandoCarrinho, setCarregandoCarrinho] =
  useState(false)

  const [
  categoriaSelecionada,
  setCategoriaSelecionada,
] = useState<string | null>(null)



  const [categorias, setCategorias] =
    useState<string[]>([])

const categoriasRef =
  useRef<HTMLDivElement>(null)

  const categoriaRefs =
  useRef<{ [key: string]: HTMLDivElement | null }>({})

  const botoesCategoriaRef =
  useRef<{ [key: string]: HTMLButtonElement | null }>({})

  const [mostrarEsquerda, setMostrarEsquerda] =
  useState(false)

const [mostrarDireita, setMostrarDireita] =
  useState(true)

 const [busca, setBusca] =
  useState("")

const [restaurante, setRestaurante] =
  useState<any>(null)

const [aparencia, setAparencia] =
  useState<any>(null)

/* APARÊNCIA */


  useEffect(() => {
  document.documentElement.style.setProperty(
    "--primary-color",
    corPrincipal
  )
}, [corPrincipal])

const corTextoBotao = "#FFFFFF"


const [banner, setBanner] =
  useState<string>("")

const [lightMode, setLightMode] =
  useState(true)

  useEffect(() => {

  const el = categoriasRef.current

  if (!el) return

  const atualizarSetas = () => {

    setMostrarEsquerda(
      el.scrollLeft > 10
    )

    setMostrarDireita(
      el.scrollLeft <
      el.scrollWidth -
      el.clientWidth -
      10
    )
  }

  atualizarSetas()

  el.addEventListener(
    "scroll",
    atualizarSetas
  )

  return () =>
    el.removeEventListener(
      "scroll",
      atualizarSetas
    )

}, [categorias])

useEffect(() => {

  const handleScroll = () => {

    let categoriaAtual = ""

    categorias.forEach((categoria) => {

      const elemento =
        categoriaRefs.current[categoria]

      if (!elemento) return

      const rect =
        elemento.getBoundingClientRect()

      if (
        rect.top <= 120 &&
        rect.bottom >= 120
      ) {
        categoriaAtual = categoria
      }

    })

if (
  categoriaAtual &&
  categoriaAtual !== categoriaSelecionada
) {

  setCategoriaSelecionada(categoriaAtual)

  botoesCategoriaRef.current[categoriaAtual]?.scrollIntoView({
    behavior: "smooth",
    inline: "center",
    block: "nearest",
  })

}

  }

  window.addEventListener(
    "scroll",
    handleScroll
  )

  return () =>
    window.removeEventListener(
      "scroll",
      handleScroll
    )

}, [
  categorias,
  categoriaSelecionada
])

  async function buscarProdutos() {

    if (!slug) return

    try {

      /* RESTAURANTE */

      const {
        data: restauranteData,
        error: restauranteError,
      } = await supabase
        .from("restaurantes")
        .select("*")
        .eq("slug", slug)
        .single()


      if (
        restauranteError ||
        !restauranteData
      ) {

        console.log(
          "Erro restaurante:",
          restauranteError
        )

        return
      }

      setRestaurante(
        restauranteData
      )

const {
  data: categoriasData
} = await supabase
  .from("categorias")
  .select("*")
  .eq(
    "restaurante_id",
    restauranteData.id
  )
  .order("ordem", {
    ascending: true,
  })

      console.log(
  "RESTAURANTE ENCONTRADO:",
  restauranteData
)

      /* APARÊNCIA */

      const {
  data: aparenciaArray,
  error: aparenciaError,
} = await supabase
  .from("aparencia")
  .select("*")
  .eq(
    "restaurante_id",
    restauranteData.id
  )
  .limit(1)

console.log(
  "BUSCANDO ID:",
  restauranteData.id
)

const aparenciaData =
  aparenciaArray?.[0]

  console.log(
  "APARENCIA ARRAY:",
  aparenciaArray
)

console.log(
  "APARENCIA ERROR:",
  aparenciaError
)

console.log(
  "RESTAURANTE ID:",
  restauranteData.id
)

   if (
  aparenciaData &&
  !aparenciaError
) {

  setAparencia(
  aparenciaData
)
console.log(
  "COR DO BANCO:",
  aparenciaData.cor_primaria
)

console.log(
  "LOGO DO BANCO:",
  aparenciaData.logo_url
)

localStorage.setItem(
  "logo-restaurante",
  aparenciaData.logo_url || ""
)

localStorage.setItem(
  "cor-principal",
  aparenciaData.cor_primaria || "#571f5b"
)

localStorage.setItem(
  "restaurante_id",
  restauranteData.id
)

console.log(
  "RESTAURANTE ID SALVO:",
  restauranteData.id
)

console.log(
  "BANNER DO BANCO:",
  aparenciaData.banner_url
)

console.log(
  "PEDIDO APARENCIA DATA:",
  aparenciaData.pedido_minimo
)

console.log(
  "NOME APARENCIA DATA:",
  aparenciaData.nome_restaurante
)

console.log(
  "APARENCIA COMPLETA:",
  JSON.stringify(
    aparenciaData,
    null,
    2
  )
)
console.log(
  "COR PRIMARIA:",
  aparenciaData?.cor_primaria
)

console.log(
  "NOME:",
  aparenciaData.nome_restaurante
)

console.log(
  "PEDIDO:",
  aparenciaData.pedido_minimo
)

console.log("RESTAURANTE:", restaurante);

 
  setBanner(
    aparenciaData.banner_url ||
    ""
  )

  setLightMode(
    aparenciaData.tema !==
    "escuro"
  )

} else {

  setBanner("")

  setLightMode(true)
}
      /* PRODUTOS */

      const {
  data: produtosData,
  error: produtosError,
} = await supabase
  .from("produtos")
  .select("*")
  .eq(
    "restaurante_id",
    restauranteData.id
  )
  .eq(
    "ativo",
    true
  )
  .order("created_at", {
    ascending: false,
  })

      if (
        produtosError ||
        !produtosData
      ) {

        console.log(
          "Erro produtos:",
          produtosError
        )

        setProdutos([])

        return
      }

      const produtosFormatados =
        await Promise.all(

          produtosData.map(
            async (produto) => {

              const {
                data: adicionais,
              } = await supabase
                .from("adicionais")
                .select("*")
                .eq(
                  "produto_id",
                  produto.id
                )
console.log(
  "SUPABASE PRODUTO:",
  produto
)

       return {

  id: produto.id,

  nome: produto.nome,

  descricao:
    produto.descricao,

  preco: Number(
    produto.preco
  ),

  precoAntigo: Number(produto.preco_antigo || 0),

  imagem:
    produto.imagem,

  categoria:
    produto.categoria ||
    "Outros",

    promocao:
  produto.promocao === true,

  adicionais:
  adicionais || [],
}

            }
          )
        )

setProdutos(
  produtosFormatados
)

setProdutosCarregados(true);

console.log(
  "PRODUTOS:",
  produtosFormatados
)

const categoriasOrdenadas =
  categoriasData?.map(
    (categoria) =>
      categoria.nome
  ) || []

setCategorias(
  categoriasOrdenadas
)

   if (
  categoriasOrdenadas.length > 0 &&
  categoriaSelecionada === null
) {
  setCategoriaSelecionada(
    categoriasOrdenadas[0]
  )
}


    } catch (error) {

      console.log(
        "Erro geral:",
        error
      )

    }
  }

  useEffect(() => {

    buscarProdutos()

    

    const cartStorage =
  localStorage.getItem(
    `cart-${slug}`
  )

    if (cartStorage) {

      setCart(
        JSON.parse(cartStorage)
      )
    }

    return () => {

    }

  }, [slug])

  useEffect(() => {

    localStorage.setItem(
  `cart-${slug}`,
  JSON.stringify(cart)
)

  }, [cart])

  function openProductModal(
    produto: ProdutoFormatado
  ) {

    setSelectedProduct(
      produto
    )

    setOpenModal(true)
  }

 function addToCart(
  produto: ProdutoFormatado,
  observacao?: string,
  adicionaisSelecionados?: Adicional[]
) {

    const totalAdicionais =
      adicionaisSelecionados?.reduce(
        (acc, item) => {

          return (
            acc +
            Number(item.preco)
          )

        },
        0
      ) || 0

    const novoItem: CartItem = {

      ...produto,

      uniqueId:
        crypto.randomUUID(),

      quantity: 1,

      observacao,

      adicionaisSelecionados:
        adicionaisSelecionados || [],

      preco:
        Number(produto.preco) +
        totalAdicionais,
    }

    setCart((prev) => [
      ...prev,
      novoItem,
    ])

    setOpenModal(false)
  }

  function increaseQuantity(
    uniqueId: string
  ) {

    setCart((prev) =>

      prev.map((item) =>

        item.uniqueId === uniqueId

          ? {
              ...item,
              quantity:
                item.quantity + 1,
            }

          : item
      )
    )
  }

  function decreaseQuantity(
    uniqueId: string
  ) {

    setCart((prev) =>

      prev
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
          (item) =>
            item.quantity > 0
        )
    )
  }

const total = cart.reduce((acc, item) => {
  console.log("ITEM DO CARRINHO:", item)
  console.log("PRECO:", item.preco)
  console.log("QUANTITY:", item.quantity)

  return acc + Number(item.preco) * Number(item.quantity)
}, 0)

  const produtosFiltrados =
  produtos.filter(
    (produto: any) => {

      const matchBusca =
        String(produto.nome || "")
          .toLowerCase()
          .includes(
            String(busca || "")
              .toLowerCase()
          )

      return matchBusca
    }
  )


  /* TEMA */

  const bgPage = "bg-[#F4F1EA]"

  const cardBg = "bg-[#FFFDF9]"

  const borderColor = lightMode
    ? "border-[#DDD6CC]"
    : "border-zinc-800"

  const textPrimary = "text-zinc-900"

  const textSecondary = lightMode
    ? "text-zinc-600"
    : "text-zinc-400"

  const inputBg = lightMode
    ? "bg-white"
    : "bg-zinc-900"

  function obterStatusLoja() {

  if (!aparencia) {
    return "Carregando..."
  }

  const agora = new Date()

  const dias = [
    "dom",
    "seg",
    "ter",
    "qua",
    "qui",
    "sex",
    "sab"
  ]

  const nomesDias = [
    "domingo",
    "segunda",
    "terça",
    "quarta",
    "quinta",
    "sexta",
    "sábado"
  ]

  const diaAtualIndex =
    agora.getDay()

  const diaAtual =
    dias[diaAtualIndex]

  const inicio =
    aparencia[`horario_${diaAtual}_inicio`]

  const fim =
    aparencia[`horario_${diaAtual}_fim`]

  const horaAtual =
    agora.getHours() * 60 +
    agora.getMinutes()

  if (inicio && fim) {

    const [hInicio, mInicio] =
      inicio.split(":").map(Number)

    const [hFim, mFim] =
      fim.split(":").map(Number)

    const minutoInicio =
      hInicio * 60 + mInicio

    const minutoFim =
      hFim * 60 + mFim

    if (
      horaAtual >= minutoInicio &&
      horaAtual <= minutoFim
    ) {
      return " Aberto Agora"
    }

    if (horaAtual < minutoInicio) {
      return ` Fechado • Abre às ${inicio}`
    }
  }

 for (let i = 1; i <= 7; i++) {

  const proximoIndex =
    (diaAtualIndex + i) % 7

  const proximoDia =
    dias[proximoIndex]

  const proximoInicio =
    aparencia[
      `horario_${proximoDia}_inicio`
    ]

  if (proximoInicio) {

    if (i === 1) {
      return `Fechado no momento • Abre amanhã às ${proximoInicio}`
    }

    return `Fechado no momento • Abre ${nomesDias[proximoIndex]} às ${proximoInicio}`
  }
}

return "Fechado no momento"
}

function obterHorarioFechamento() {

  if (!aparencia) return ""

  const agora = new Date()

  const dias = [
    "dom",
    "seg",
    "ter",
    "qua",
    "qui",
    "sex",
    "sab"
  ]

  const diaAtual =
    dias[agora.getDay()]

  return (
    aparencia[
      `horario_${diaAtual}_fim`
    ] || ""
  )
}


  return (

    <main
      className={`
        min-h-screen
        transition-all
        duration-300
        ${bgPage}
        ${textPrimary}
      `}
    >

      {/* HERO */}

<section
className="
w-full
max-w-7xl
mx-auto
px-4
pt-4
"
>

 <div
  className="
    w-full
    h-[190px]
    md:h-[340px]
    rounded-[28px]
    overflow-hidden
    relative
  "

    style={{
      backgroundImage: banner
        ? `url(${banner})`
        : undefined,
      backgroundSize: "cover",
backgroundRepeat: "no-repeat",
backgroundPosition: "center",
    }}
  >

   {/* ESCURECER BANNER */}

<div className="absolute inset-0 bg-black/45 rounded-3xl z-10" />

{/* TEXTO SOBRE O BANNER */}

<div
  className="
    absolute
    left-6
    md:left-12
    bottom-7
    z-20
    text-white
  "
>

  <h1
    className="
      text-[34px]
      md:text-6xl
      font-black
    "
  >
    {
      aparencia?.nome_restaurante ||
      restaurante?.nome
    }
  </h1>

  <p className="mt-1 text-base">
    {aparencia?.categoria_restaurante}
    {" • "}
    {aparencia?.tipo_atendimento}
  </p>

  <div className="mt-4">

    <div className="flex items-center gap-2 mt-2">
  <span
  className="
font-semibold
text-[10px]
"
  style={{
    color: obterStatusLoja().includes("Aberto")
      ? "#22C55E"
      :"#FFFFFF"  

  }}
>
    
    ● {obterStatusLoja()}
  </span>

  {obterStatusLoja().includes("Aberto") && (
  <span className="text-white/80">
    • Fecha às {obterHorarioFechamento()}
  </span>
)}
</div>

  </div>

  <div
  className="
    mt-3
    inline-flex
    items-center
    rounded-full
    bg-white/15
    backdrop-blur-sm
    px-4
    py-2
    text-sm
    font-medium
  "
>
  💰 Pedido mínimo R$ {
    Number(
      aparencia?.pedido_minimo || 0
    ).toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits: 2,
      }
    )
  }
</div>

</div>

{logo && (

<div
className="
absolute
right-8
bottom-8
z-30
"
>

<div
className="
w-24
h-24
rounded-full
bg-white
shadow-2xl
border-4
border-white
overflow-hidden
"
>

<img
src={logo}
alt="Logo"
className="
w-full
h-full
object-cover
"
/>

</div>

</div>

)}

</div>

<div
className="
max-w-7xl
mx-auto
px-5
pt-5
pb-4
">        

<div
className="
sticky
top-3
z-40
mb-8
"
>

<div
className="
w-full
bg-white
rounded-xl
shadow-md
border
border-[#ECE8E2]
px-4
py-4
"
>

<div className="relative">

<div
ref={categoriasRef}
className="
flex
items-center
gap-2
overflow-x-auto
scroll-smooth
whitespace-nowrap
scrollbar-hide
pr-10
"
>

{categorias.map((categoria, index) => (


<div
  key={categoria}
  className="
    flex
    items-center
    shrink-0
  "
>

<button
   ref={(el) => {
     botoesCategoriaRef.current[categoria] = el
   }}
   id={`botao-${categoria}`}
   onClick={() => {

  setCategoriaSelecionada(categoria)

const categoriaId =
  categoria
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")

const element =
  document.getElementById(
    `categoria-${categoriaId}`
  )

  if (element) {

    const y =
      element.getBoundingClientRect().top +
      window.pageYOffset -
      180

    window.scrollTo({
      top: y,
      behavior: "smooth",
    })
  }
}}
className="
px-6
h-11
rounded-xl
font-semibold
whitespace-nowrap
transition-all
duration-300
"
    style={{
      backgroundColor:
  categoriaSelecionada === categoria
    ? corPrincipal
    : "#FFFFFF",

      color:
        categoriaSelecionada === categoria
          ? "#FFFFFF"
          : "#3F3F46",

          border: "1px solid #E4E4E7"
    }}
  >
    {categoria}
  </button>

  {index < categorias.length - 1 && (

<div
className="
h-9
w-px
bg-zinc-200
mx-3
"
/>

  )}

</div>

))}


</div>
</div>

          </div>

        </div>


        {categorias.map((categoria, indexCategoria) => {

  const produtosCategoria =
    produtosFiltrados.filter(
      (produto) =>
        produto.categoria === categoria
    )

  if (
    produtosCategoria.length === 0
  ) {
    return null
  }

const categoriaId =
  categoria
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")

return (

<div
  id={`categoria-${categoriaId}`}
  key={categoria}
  ref={(el) => {
    categoriaRefs.current[categoria] = el
  }}
  className="mb-14"
>
<h2
  className="
    text-[34px]
    font-black
    text-zinc-900
    mb-6
  "
>
  {categoria}
</h2>

<div
  className={
    indexCategoria === 0
      ? `
          flex
          flex-nowrap
          gap-5
          overflow-x-auto
          overflow-y-hidden
          px-2
          pb-3
          snap-x
          snap-mandatory
          scrollbar-hide
        `
      : `
          flex
          flex-col
          gap-5
        `
  }
>

{!produtosCarregados ? (

  [...Array(6)].map((_, index) => (

    <div
      key={index}
      className="
        rounded-3xl
        bg-white
      shadow-[0_8px_22px_rgba(0,0,0,0.07)]
        overflow-hidden
        animate-pulse
      "
    >
      <div className="w-full h-40 bg-zinc-200" />

      <div className="p-4">

        <div className="h-5 w-3/4 bg-zinc-200 rounded" />

        <div className="h-4 w-full bg-zinc-100 rounded mt-3" />

        <div className="h-4 w-2/3 bg-zinc-100 rounded mt-2" />

        <div className="h-8 w-24 bg-zinc-200 rounded-xl mt-5" />

      </div>

    </div>

  ))

) : (

produtosCategoria.map((produto) => (

  indexCategoria === 0 ? (

    <FeaturedProductCard
      key={produto.id}
      product={produto}
      corPrincipal={corPrincipal}
      onClick={() => openProductModal(produto)}
    />

  ) : (

    <ProductCard
      key={produto.id}
      product={produto}
      corPrincipal={corPrincipal}
      onAdd={() => openProductModal(produto)}
    />

  )

))

)}

      </div>

    </div>

  )
})}

      
      <ProductModal
  open={openModal}
  onClose={() => setOpenModal(false)}
  product={selectedProduct}
  onAdd={addToCart}
  corPrincipal={corPrincipal}
/>

    <CheckoutModal
  open={openCheckout}
  onClose={() => setOpenCheckout(false)}
  cart={cart}
  total={total}
  slug={slug}
  restauranteId={restaurante?.id}
  lojaAberta={obterStatusLoja().includes("Aberto")}
  clearCart={() => {
    setCart([])
    localStorage.removeItem(
  `cart-${slug}`
)
  }}
/>

{cart.length > 0 && (
<div
className="
fixed
bottom-[74px]
left-0
right-0
z-[999]
shadow-2xl
pb-[env(safe-area-inset-bottom)]
"
style={{
  backgroundColor: corPrincipal,
}}
>

<div
  className="
    px-5
    py-6
    flex
    items-center
    justify-between
  "
>
      <div className="flex items-center gap-3">

        <div
          className="
            w-14
            h-14
            rounded-xl
            overflow-hidden
            bg-white
            shrink-0
          "
        >
          {cart[0]?.imagem && (
            <img
              src={cart[0].imagem}
              alt=""
              className="
                w-full
                h-full
                object-cover
              "
            />
          )}
        </div>

        <div className="text-white">

          <p className="font-bold text-sm">
            {cart.reduce(
              (acc, item) =>
                acc + item.quantity,
              0
            )} itens no carrinho
          </p>

          <p className="text-white/80 text-[15px]">
            Total: R$ {total.toLocaleString(
  "pt-BR",
  {
    minimumFractionDigits: 2,
  }
)}
          </p>

        </div>

      </div>

<button
  disabled={carregandoCarrinho}
  onClick={() => {

    if (carregandoCarrinho) return;

    setCarregandoCarrinho(true);

    setTimeout(() => {
      window.location.href =
        `/${slug}/carrinho`;
    }, 300);

  }}
  className="
    bg-[#22C55E]
    hover:bg-emerald-600

    text-white
    font-semibold

    px-4
    py-2

    rounded-xl

    flex
    items-center
    justify-center
    gap-3

    transition-all
    duration-200

    active:scale-95

    disabled:opacity-70
    disabled:cursor-not-allowed

    min-w-[155px]
  "
>
  {carregandoCarrinho ? (
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
    "Ver carrinho"
  )}
</button>

    </div>
  </div>
)}

</div>

</section>

<div className="-mt-4">
<RestaurantFooter
  corPrincipal={corPrincipal}
/>

<div
  className={
    cart.length > 0
      ? "h-28"
      : "h-0"
  }
/>

</div>

<BottomNavigation
  corPrincipal={corPrincipal}
/>

</main>
  )
}