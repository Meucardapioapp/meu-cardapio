"use client"

import { useEffect, useState } from "react"

import Header from "./components/Header"
import Hero from "./components/Hero"
import Benefits from "./components/Benefits"
import ProductCard from "./components/ProductCard"
import ProductModal from "./components/ProductModal"
import Cart from "./components/Cart"
import CheckoutModal from "./components/CheckoutModal"

import { supabase } from "./utils/supabase/client"

type Produto = {
  id: string
  nome: string
  descricao: string
  preco: number
  imagem: string
}

type CartItem = {
  id: string
  uniqueId: string
  name: string
  price: number
  quantity: number
  observation?: string
  adicionais?: {
    nome: string
    preco: number
  }[]
}

export default function Home() {

  const [produtos, setProdutos] = useState<Produto[]>([])

  const [cart, setCart] = useState<CartItem[]>([])

  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null)

  const [openModal, setOpenModal] = useState(false)

  const [openCheckout, setOpenCheckout] = useState(false)

  const [mounted, setMounted] = useState(false)

  useEffect(() => {

    setMounted(true)

    const savedCart = localStorage.getItem("cart")

    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }

  }, [])

  useEffect(() => {

    if (mounted) {
      localStorage.setItem("cart", JSON.stringify(cart))
    }

  }, [cart, mounted])

  useEffect(() => {

    async function fetchProdutos() {

      const { data, error } = await supabase
        .from("produtos")
        .select("*")

      if (error) {
        console.log(error)
        return
      }

      if (data) {
        setProdutos(data)
      }
    }

    fetchProdutos()

  }, [])

  function generateUniqueId(item: CartItem) {

    return JSON.stringify({
      id: item.id,
      observation: item.observation || "",
      adicionais: item.adicionais || []
    })
  }

  function addToCart(item: CartItem) {

    const itemWithId = {
      ...item,
      uniqueId: generateUniqueId(item)
    }

    setCart((prev) => {

      const existingItem = prev.find(
        (product) => product.uniqueId === itemWithId.uniqueId
      )

      if (existingItem) {

        return prev.map((product) =>
          product.uniqueId === itemWithId.uniqueId
            ? {
                ...product,
                quantity: product.quantity + item.quantity,
              }
            : product
        )
      }

      return [...prev, itemWithId]
    })
  }

  function increaseQuantity(uniqueId: string) {

    setCart((prev) =>
      prev.map((item) =>
        item.uniqueId === uniqueId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    )
  }

  function decreaseQuantity(uniqueId: string) {

    setCart((prev) =>
      prev
        .map((item) =>
          item.uniqueId === uniqueId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  if (!mounted) {
    return null
  }

  return (

    <main className="bg-black min-h-screen text-white">

      <Header cart={cart} />

      <Hero />

      <Benefits />

      <section className="max-w-7xl mx-auto px-3 md:px-6 py-8 md:py-10">

        <div className="flex items-center justify-between mb-5 md:mb-6">

          <h2 className="text-2xl md:text-4xl font-bold leading-tight">
            Cardápio Popular
          </h2>

          <button className="bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm rounded-xl hover:bg-zinc-800 transition">
            Ver Tudo
          </button>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">

            {produtos.map((produto) => (

              <ProductCard
                key={produto.id}
                product={{
                  id: produto.id,
                  name: produto.nome,
                  description: produto.descricao,
                  price: Number(produto.preco),
                  image: produto.imagem,
                }}
                onAdd={() => {
                  setSelectedProduct(produto)
                  setOpenModal(true)
                }}
              />

            ))}

          </div>

          <Cart
            cart={cart}
            increaseQuantity={increaseQuantity}
            decreaseQuantity={decreaseQuantity}
            onCheckout={() => setOpenCheckout(true)}
          />

        </div>

      </section>

      {openModal && selectedProduct && (

        <ProductModal
          produto={selectedProduct}
          onClose={() => setOpenModal(false)}
          onAddToCart={(item: CartItem) => {

            addToCart(item)

            setOpenModal(false)
          }}
        />

      )}

      {openCheckout && (

        <CheckoutModal
          cart={cart}
          onClose={() => setOpenCheckout(false)}
        />

      )}

    </main>
  )
}