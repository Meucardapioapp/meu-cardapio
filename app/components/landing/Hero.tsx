"use client"

import Image from "next/image"
import {
  CreditCard,
  Headphones,
  ShoppingCart,
  Menu,
} from "lucide-react"

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#F8F6F4] pt-28 pb-16 md:pt-36 md:pb-24">

      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 lg:grid-cols-2 lg:px-8">

        {/* ESQUERDA */}
        <div className="text-center lg:text-left">

          <div className="mb-5 inline-flex items-center rounded-full border border-[#6D1F2F]/20 bg-white px-4 py-2 text-xs md:text-sm font-semibold text-[#6D1F2F] shadow-sm">
            Cardápio Digital Profissional
          </div>

          <h1 className="mx-auto max-w-2xl text-4xl font-black leading-[0.95] tracking-tight text-black sm:text-5xl md:text-6xl lg:mx-0 lg:text-7xl">
            Transforme
            <br />
            seu delivery
            <br />
            em um{" "}
            <span className="text-[#6D1F2F]">
              site
              <br />
              profissional
            </span>
            <br />
            que vende
            <br />
            sozinho
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-600 md:text-lg lg:mx-0">
            Crie um cardápio digital premium com pagamentos online,
            identidade própria e uma experiência moderna para seus
            clientes.
          </p>

          {/* PAGAMENTOS */}
          <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
            {[
              "Pix",
              "Crédito",
              "Débito",
              "Apple Pay",
              "Google Pay",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-xs md:px-5 md:py-3 md:text-sm font-semibold shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>

          {/* BOTÕES */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">

            <button className="rounded-2xl bg-[#6D1F2F] px-7 py-4 text-base font-bold text-white shadow-xl transition hover:scale-[1.02] hover:bg-[#531723]">
              Criar Meu Cardápio
            </button>

            <button className="rounded-2xl border border-zinc-200 bg-white px-7 py-4 text-base font-bold text-black shadow-sm transition hover:bg-zinc-100">
              Ver Demonstração
            </button>

          </div>

          {/* STATS */}
          <div className="mt-12 grid grid-cols-3 gap-4 border-t border-zinc-200 pt-8">

            <div className="flex flex-col items-center lg:items-start">

              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-md md:h-14 md:w-14">
                <ShoppingCart className="h-5 w-5 text-[#6D1F2F]" />
              </div>

              <h3 className="text-2xl font-black text-black md:text-4xl">
                +2.500
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                restaurantes
              </p>

            </div>

            <div className="flex flex-col items-center lg:items-start">

              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-md md:h-14 md:w-14">
                <CreditCard className="h-5 w-5 text-[#6D1F2F]" />
              </div>

              <h3 className="text-2xl font-black text-black md:text-4xl">
                98%
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                satisfação
              </p>

            </div>

            <div className="flex flex-col items-center lg:items-start">

              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-md md:h-14 md:w-14">
                <Headphones className="h-5 w-5 text-[#6D1F2F]" />
              </div>

              <h3 className="text-2xl font-black text-black md:text-4xl">
                24h
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                suporte premium
              </p>

            </div>

          </div>

        </div>

        {/* DIREITA */}
        <div className="relative flex justify-center">

          {/* CELULAR */}
          <div className="relative w-[280px] rounded-[3rem] border-[8px] border-black bg-black shadow-2xl md:w-[320px]">

            {/* NOTCH */}
            <div className="absolute left-1/2 top-0 z-30 h-6 w-36 -translate-x-1/2 rounded-b-3xl bg-black" />

            {/* TELA */}
            <div className="overflow-hidden rounded-[2.4rem] bg-[#F8F6F4]">

              {/* HEADER */}
              <div className="bg-gradient-to-br from-[#6D1F2F] via-[#7B2335] to-[#521522] p-5 text-white">

                <div className="flex items-center justify-between">

                  <Menu size={20} />

                  <div className="text-center">

                    <div className="mx-auto mb-2 h-14 w-14 overflow-hidden rounded-full border-2 border-white">

                      <Image
                        src="/images/acai/acai3.png"
                        alt="Açaí"
                        width={100}
                        height={100}
                        className="h-full w-full object-cover"
                      />

                    </div>

                    <h3 className="text-2xl font-black">
                      Vyora Açaí
                    </h3>

                    <p className="mt-1 text-xs text-white/80">
                      Açaí, Sorvetes e muito mais!
                    </p>

                  </div>

                  <ShoppingCart size={20} />

                </div>

                {/* BANNER */}
                <div className="mt-5 overflow-hidden rounded-3xl bg-white/10 p-4 backdrop-blur">

                  <div className="flex items-center gap-3">

                    <div className="flex-1">

                      <h4 className="text-lg font-black">
                        Monte do seu jeito
                      </h4>

                      <p className="mt-1 text-xs text-white/80">
                        + de 30 ingredientes
                        <br />
                        para combinar!
                      </p>

                    </div>

                    <div className="h-20 w-20 overflow-hidden rounded-2xl">

                      <Image
                        src="/images/acai/acai1.png"
                        alt="Açaí"
                        width={200}
                        height={200}
                        className="h-full w-full object-cover"
                      />

                    </div>

                  </div>

                </div>

              </div>

              {/* CATEGORIAS */}
              <div className="flex gap-2 overflow-auto px-4 py-4">

                {[
                  "Açaí",
                  "Cremes",
                  "Milk Shakes",
                ].map((item, index) => (

                  <button
                    key={item}
                    className={`whitespace-nowrap rounded-2xl px-4 py-2 text-xs font-bold ${
                      index === 0
                        ? "bg-[#6D1F2F] text-white"
                        : "border border-zinc-200 bg-white text-zinc-700"
                    }`}
                  >
                    {item}
                  </button>

                ))}

              </div>

              {/* PRODUTOS */}
              <div className="space-y-3 px-4 pb-5">

                {[
                  {
                    title: "Açaí Premium",
                    price: "24,90",
                  },
                  {
                    title: "Açaí Super",
                    price: "28,90",
                  },
                ].map((item) => (

                  <div
                    key={item.title}
                    className="flex items-center gap-3 rounded-3xl border border-zinc-200 bg-white p-3 shadow-sm"
                  >

                    <div className="h-20 w-20 overflow-hidden rounded-2xl">

                      <Image
                        src="/images/acai/acai2.png"
                        alt="Açaí"
                        width={200}
                        height={200}
                        className="h-full w-full object-cover"
                      />

                    </div>

                    <div className="flex-1">

                      <h4 className="text-lg font-black">
                        {item.title}
                      </h4>

                      <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                        Açaí puro, banana,
                        granola e leite condensado
                      </p>

                      <p className="mt-2 text-2xl font-black text-[#6D1F2F]">
                        R$ {item.price}
                      </p>

                    </div>

                    <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6D1F2F] text-lg font-bold text-white">
                      +
                    </button>

                  </div>

                ))}

              </div>

              {/* CARRINHO */}
              <div className="sticky bottom-0 bg-[#6D1F2F] px-5 py-4 text-white">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm font-bold">
                      Ver carrinho • 2 itens
                    </p>

                  </div>

                  <span className="text-xl font-black">
                    R$ 53,80
                  </span>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  )
}