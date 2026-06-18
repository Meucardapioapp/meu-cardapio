"use client"

export const dynamic = "force-dynamic"

import {
  useEffect,
  useState,
  useRef,
} from "react"

import { useParams } from "next/navigation"

import Header from "../components/Header"
import Benefits from "../components/Benefits"
import ProductCard from "../components/ProductCard"
import ProductModal from "../components/ProductModal"
import Cart from "../components/Cart"
import CheckoutModal from "../components/CheckoutModal"

import { supabase } from "@/lib/supabase"

import type {
  Adicional,
  ProdutoFormatado,
  CartItem
} from "../types"

export default function CardapioPage() {

const params = useParams()

const slug = params.slug as string
console.log("SLUG ATUAL:", slug)

useEffect(() => {
  localStorage.setItem(
    "cardapio-slug",
    slug
  )
}, [slug])

  const [produtos, setProdutos] =
    useState<ProdutoFormatado[]>([])

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

const [themeColor, setThemeColor] =
  useState("#7F1D1D")

const corPrincipal =
  themeColor || "#7F1D1D"

  useEffect(() => {
  document.documentElement.style.setProperty(
    "--primary-color",
    corPrincipal
  )
}, [corPrincipal])

const corTextoBotao = "#FFFFFF"

const [logo, setLogo] =
  useState<string>("")

const [banner, setBanner] =
  useState<string>("")

const [lightMode, setLightMode] =
  useState(true)

const [loading, setLoading] =
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

      setCategoriaSelecionada(
        categoriaAtual
      )

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

  setThemeColor(
    aparenciaData.cor_primaria ||
    "#7F1D1D"
  )

  setLogo(
    aparenciaData.logo_url ||
    ""
  )

  setBanner(
    aparenciaData.banner_url ||
    ""
  )

  setLightMode(
    aparenciaData.tema !==
    "escuro"
  )

} else {

  setThemeColor("#7F1D1D")

  setLogo("")

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
      console.log(
  "PRODUTOS:",
  produtosFormatados
)

      const categoriasUnicas = [

        ...new Set(

          produtosFormatados.map(
            (produto: any) =>
              produto.categoria
          )
        )
      ]

      setCategorias(
        categoriasUnicas
      )

      if (
  categoriasUnicas.length > 0 &&
  categoriaSelecionada === null
) {
  setCategoriaSelecionada(
    categoriasUnicas[0]
  )
}

      setLoading(false)

    } catch (error) {

      console.log(
        "Erro geral:",
        error
      )

      setLoading(false)
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

    if (loading) {

    return (

      <main className="
        min-h-screen
        flex
        items-center
        justify-center
        bg-black
        text-white
      ">

        <p className="
          text-xl
          font-bold
        ">
          Carregando cardápio...
        </p>

      </main>
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

      <Header
  logo={logo}
  cart={cart}
  corPrincipal={corPrincipal}
  openCart={() => {
    window.location.href = `/${slug}/carrinho`
  }}
/>

      {/* HERO */}

     <section className="
max-w-7xl
mx-auto
px-4
pt-0
">

 <div
  className="
    w-full
    h-[220px]
    md:h-[420px]
    rounded-3xl
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

<div className="absolute inset-0 bg-black/40 z-10" />

{/* TEXTO SOBRE O BANNER */}

<div
  className="
    absolute
    left-8
    md:left-12
    top-1/2
    -translate-y-1/2
    z-20
    text-white
  "
>

  <h1
    className="
      text-xl
      md:text-5xl
      font-black
    "
  >
    {
      aparencia?.nome_restaurante ||
      restaurante?.nome
    }
  </h1>

  <p className="mt-1 text-xs">
    {aparencia?.categoria_restaurante}
    {" • "}
    {aparencia?.tipo_atendimento}
  </p>

  <div className="mt-4">

    <div className="flex items-center gap-2 mt-2">
  <span
  className="font-bold"
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

  <p className="mt-2 text-base">
    Pedido mínimo:
    {" "}
    R$
    {Number(
      aparencia?.pedido_minimo || 0
    ).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}
  </p>

</div>

<div
  className="
    absolute
left-1/2
-translate-x-1/2
-bottom-0
z-[999]
  "
>
  <div
    className="
      w-20
      h-20
      md:w-40
      md:h-40
      rounded-full
      overflow-hidden
      border-4
      border-white
      bg-white
      shadow-lg
    "
  >
    {logo && (
      <img
        src={logo}
        alt="Logo"
        className="
          w-full
          h-full
          object-cover
        "
      />
    )}
  </div>
</div>

</div>



</section>

      <section className="
        max-w-7xl
        mx-auto
        px-5
        pt-0
        pb-12
      ">

        

        <div className="
sticky
top-2
z-20
mt-2
mb-4
">

<div
className="
bg-white
rounded-3xl
shadow-lg
border
border-zinc-100
px-3
py-2
overflow-hidden
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
   id={`botao-${categoria}`}
   onClick={() => {

  setCategoriaSelecionada(categoria)

  const element =
    document.getElementById(
      `categoria-${categoria}`
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
      px-5
      h-10
      rounded-2xl
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
        h-8
        w-px
        bg-zinc-200
        mx-2
      "
    />

  )}

</div>

))}

{mostrarEsquerda && (

<button
onClick={() => {

  categoriasRef.current?.scrollBy({
    left: -250,
    behavior: "smooth",
  })

}}
className="
absolute
left-0
top-1/2
-translate-y-1/2
z-20
w-8
h-8
rounded-full
bg-white
shadow-md
flex
items-center
justify-center
"
>
  ‹
</button>

)}

{mostrarDireita && (

<button
onClick={() => {

  categoriasRef.current?.scrollBy({
    left: 250,
    behavior: "smooth",
  })

}}
className="
absolute
right-0
top-1/2
-translate-y-1/2
z-20
w-8
h-8
rounded-full
bg-white
shadow-md
flex
items-center
justify-center
"
>
  ›
</button>

)}


</div>
</div>

          </div>

        </div>

        {categorias.map((categoria) => {

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

  return (

    <div
  id={`categoria-${categoria}`}
  key={categoria}
  ref={(el) => {
    categoriaRefs.current[categoria] = el
  }}
  className="mb-14"
>

      <h3
        className={`
          text-3xl
          font-black
          mb-6
          ${textPrimary}
        `}
      >
        {categoria}
      </h3>

   <div
 className="
  grid
  grid-cols-2
  md:grid-cols-3
  lg:grid-cols-3
  gap-2
"
>


      {produtosCategoria.map((produto) => (

  <ProductCard
    key={produto.id}
    product={produto}
    corPrincipal={corPrincipal}
    onAdd={() => openProductModal(produto)}
  />

))} 

      </div>

    </div>

  )
})}

      </section>

      

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
      bottom-3
      left-3
      right-3
      max-w-7xl
mx-auto
      z-[999]
    "
  >
    <div
      className="
        rounded-3xl
        shadow-2xl
        px-3
        py-2
        flex
        items-center
        justify-between
      "
     style={{
  background: `linear-gradient(
    90deg,
    ${corPrincipal},
    ${corPrincipal}CC,
    ${corPrincipal}
  )`
}}
    >
      <div className="flex items-center gap-3">

        <div
          className="
            w-12
            h-12
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

          <p className="font-bold text-base">
            {cart.reduce(
              (acc, item) =>
                acc + item.quantity,
              0
            )} itens no carrinho
          </p>

          <p className="text-white/80 text-xs">
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
        onClick={() => {
  window.location.href =
    `/${slug}/carrinho`
}}
        className="
          bg-[#22C55E]
          hover:bg-emerald-600
          text-white
          font-semibold
          px-4
          py-2
          rounded-xl
          transition-all
        "
      >
        Ver carrinho
      </button>

    </div>
  </div>
)}

    </main>
  )
}