"use client"

export const dynamic = "force-dynamic"

import {
  useEffect,
  useState,
} from "react"

import Header from "./components/Header"
import Hero from "./components/Hero"
import Benefits from "./components/Benefits"
import ProductCard from "./components/ProductCard"
import ProductModal from "./components/ProductModal"
import Cart from "./components/Cart"
import CheckoutModal from "./components/CheckoutModal"

import { supabase } from "@/utils/supabase/client"

type Adicional = {
  nome: string
  preco: number
}

type ProdutoFormatado = {
  id: string
  name: string
  description: string
  price: number
  image: string
  adicionais?: Adicional[]
}

type CartItem = ProdutoFormatado & {
  uniqueId: string
  quantity: number
  observation?: string
  adicionaisSelecionados?: Adicional[]
}

export default function Home() {

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

  async function buscarProdutos() {

    const { data, error } =
      await supabase
        .from("produtos")
        .select("*")
        .order("created_at", {
          ascending: false,
        })

    if (error) {

      console.log(error)

      return
    }

    if (!data) {

      setProdutos([])

      return
    }

    const produtosFormatados =
      await Promise.all(

        data.map(async (produto) => {

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

            name: produto.nome,

            description:
              produto.descricao,

            price: Number(
              produto.preco
            ),

            image:
              produto.imagem,

            adicionais:
              adicionais || [],
          }
        })
      )

    setProdutos(
      produtosFormatados
    )
  }

  useEffect(() => {

    buscarProdutos()

    const handleFocus = () => {

      buscarProdutos()
    }

    window.addEventListener(
      "focus",
      handleFocus
    )

    const cartStorage =
      localStorage.getItem("cart")

    if (cartStorage) {

      setCart(
        JSON.parse(cartStorage)
      )
    }

    const channelProdutos =
      supabase

        .channel(
          "realtime-produtos"
        )

        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "produtos",
          },
          () => {

            buscarProdutos()
          }
        )

        .subscribe()

    const channelAdicionais =
      supabase

        .channel(
          "realtime-adicionais"
        )

        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "adicionais",
          },
          () => {

            buscarProdutos()
          }
        )

        .subscribe()

    return () => {

      window.removeEventListener(
        "focus",
        handleFocus
      )

      supabase.removeChannel(
        channelProdutos
      )

      supabase.removeChannel(
        channelAdicionais
      )
    }

  }, [])

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

      observation,

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

  return (

    <main className="min-h-screen bg-black text-white">

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

      <Hero />

      <Benefits />

      <section className="max-w-7xl mx-auto px-5 py-12">

        <div className="flex items-center justify-between mb-8">

          <div>

            <h2 className="text-4xl font-black">
              Cardápio
            </h2>

            <p className="text-zinc-400 mt-2">
              Escolha seus produtos
            </p>

          </div>

          <div className="bg-zinc-900 border border-zinc-800 px-5 py-3 rounded-2xl">

            <span className="text-zinc-400">
              Produtos:
            </span>

            <span className="ml-2 font-bold text-green-400">
              {produtos.length}
            </span>

          </div>

        </div>

        {produtos.length === 0 ? (

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center text-zinc-400">

            Nenhum produto encontrado

          </div>

        ) : (

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {produtos.map(
              (produto) => (

                <ProductCard
                  key={produto.id}
                  product={produto}
                  onAdd={() =>
                    openProductModal(
                      produto
                    )
                  }
                />

              )
            )}

          </div>

        )}

      </section>

      <section
        id="cart-section"
        className="max-w-7xl mx-auto px-5 pb-10"
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