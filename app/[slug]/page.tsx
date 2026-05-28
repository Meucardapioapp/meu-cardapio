"use client"

export const dynamic = "force-dynamic"

import {
  useEffect,
  useState,
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
  ] = useState("Todos")

  const [categorias, setCategorias] =
    useState<string[]>([])

  const [busca, setBusca] =
    useState("")

  const [restaurante, setRestaurante] =
    useState<any>(null)

  /* APARÊNCIA */

  const [themeColor, setThemeColor] =
    useState("#7F1D1D")

  const [logo, setLogo] =
    useState<string>("")

  const [banner, setBanner] =
    useState<string>("")

  const [lightMode, setLightMode] =
    useState(true)

  const [loading, setLoading] =
    useState(true)

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

const aparenciaData =
  aparenciaArray?.[0]

      if (
  aparenciaData &&
  !aparenciaError
) {

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

       return {

  id: produto.id,

  nome: produto.nome,

  descricao:
    produto.descricao,

  preco: Number(
    produto.preco
  ),

  imagem:
    produto.imagem,

  categoria:
    produto.categoria ||
    "Outros",

  adicionais:
  adicionais || [],
}

            }
          )
        )

        setProdutos(
        produtosFormatados
      )

      const categoriasUnicas = [

        "Todos",

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

    const interval =
      setInterval(() => {

        buscarProdutos()

      }, 3000)

    const cartStorage =
      localStorage.getItem("cart")

    if (cartStorage) {

      setCart(
        JSON.parse(cartStorage)
      )
    }

    return () => {

      clearInterval(interval)
    }

  }, [slug])

  useEffect(() => {

    localStorage.setItem(
      "cart",
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
    observation?: string,
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

      price:
        Number(produto.price) +
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

  const total = cart.reduce(

    (acc, item) =>

      acc +
      Number(item.price) *
        item.quantity,

    0
  )

  const produtosFiltrados =
    produtos.filter(
      (produto: any) => {

        const matchCategoria =

          categoriaSelecionada ===
          "Todos"

            ? true

            : produto.categoria ===
              categoriaSelecionada

        const matchBusca =

          produto.name
            .toLowerCase()

            .includes(
              busca.toLowerCase()
            )

        return (
          matchCategoria &&
          matchBusca
        )
      }
    )

  /* TEMA */

  const bgPage = lightMode
    ? "bg-[#F4F1EA]"
    : "bg-black"

  const cardBg = lightMode
    ? "bg-white"
    : "bg-zinc-900"

  const borderColor = lightMode
    ? "border-[#DDD6CC]"
    : "border-zinc-800"

  const textPrimary = lightMode
    ? "text-zinc-900"
    : "text-white"

  const textSecondary = lightMode
    ? "text-zinc-600"
    : "text-zinc-400"

  const inputBg = lightMode
    ? "bg-white"
    : "bg-zinc-900"

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
        cart={cart}
        openCart={() => {

          const carrinho =
            document.getElementById(
              "cart-section"
            )

          carrinho?.scrollIntoView({
            behavior: "smooth",
          })
        }}
      />

      {/* HERO */}

      <section
        className="
          relative
          overflow-hidden
        "
        style={{
          backgroundColor:
            banner
              ? undefined
              : themeColor,

          backgroundImage:
            banner
              ? `url(${banner})`
              : undefined,

          backgroundSize: "cover",

          backgroundPosition:
            "center",
        }}
      >

        <div className="
          backdrop-brightness-[0.55]
          px-6
          py-20
        ">

          <div className="
            max-w-7xl
            mx-auto
            flex
            flex-col
            md:flex-row
            md:items-center
            gap-6
          ">

            <div
              className="
                w-28
                h-28
                rounded-3xl
                overflow-hidden
                bg-white
                flex
                items-center
                justify-center
                shadow-2xl
              "
            >

              {logo ? (

                <img
                  src={logo}
                  alt="Logo"
                  className="
                    w-full
                    h-full
                    object-cover
                  "
                />

              ) : (

                <div className="
                  w-full
                  h-full
                  flex
                  items-center
                  justify-center
                  text-zinc-400
                  text-sm
                ">
                  LOGO
                </div>
              )}

            </div>

            <div>

              <h1 className="
                text-5xl
                md:text-6xl
                font-black
                text-white
              ">
                {restaurante?.nome}
              </h1>

              <p className="
                text-white/80
                mt-3
                text-lg
              ">
                O melhor delivery da cidade
              </p>

            </div>

          </div>

        </div>

      </section>

      <Benefits />

      <section className="
        max-w-7xl
        mx-auto
        px-5
        py-12
      ">

        <div className="
          flex
          items-center
          justify-between
          mb-8
        ">

          <div>

            <h2 className="
              text-4xl
              font-black
            ">
              Cardápio
            </h2>

            <p
              className={`${textSecondary} mt-2`}
            >
              Escolha seus produtos
            </p>

          </div>

        </div>

        <div className={`
          sticky
          top-20
          z-40
          backdrop-blur-md
          py-4
          mb-8
          ${
            lightMode
              ? "bg-[#F4F1EA]/95"
              : "bg-black/95"
          }
        `}>

          <div className="mb-6">

            <input
              type="text"
              placeholder="Buscar produto..."
              value={busca}
              onChange={(e) =>
                setBusca(e.target.value)
              }
              className={`
                w-full
                border
                rounded-2xl
                px-5
                py-4
                transition-all
                ${inputBg}
                ${borderColor}
                ${textPrimary}
              `}
            />

          </div>

        </div>

        <div className="
          grid
          grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-3
          gap-6
        ">

          {produtosFiltrados.map(
            (produto) => (

              <div
                key={produto.id}
                className={`
                  ${cardBg}
                  ${borderColor}
                  border
                  rounded-3xl
                  overflow-hidden
                  hover:scale-[1.02]
                  transition-all
                `}
              >

                <ProductCard
                  product={produto}
                  onAdd={() =>
                    openProductModal(
                      produto
                    )
                  }
                />

              </div>

            )
          )}

        </div>

      </section>

      <section
        id="cart-section"
        className="
          max-w-7xl
          mx-auto
          px-5
          pb-10
        "
      >

        <Cart
          cart={cart}
          increaseQuantity={
            increaseQuantity
          }
          decreaseQuantity={
            decreaseQuantity
          }
          onCheckout={() =>
            setOpenCheckout(true)
          }
        />

      </section>

      <ProductModal
        open={openModal}
        onClose={() =>
          setOpenModal(false)
        }
        product={selectedProduct}
        onAdd={addToCart}
      />

      <CheckoutModal
        open={openCheckout}
        onClose={() =>
          setOpenCheckout(false)
        }
        cart={cart}
        total={total}
        slug={slug}
        restaurantId={restaurante?.id}
        clearCart={() => {

          setCart([])

          localStorage.removeItem(
            "cart"
          )
        }}
      />

    </main>
  )
}