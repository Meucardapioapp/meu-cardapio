"use client"

import Image from "next/image"
import {
  Star,
} from "lucide-react"

export default function Testimonials() {
  return (
    <section
      id="depoimentos"
      className="bg-[#F8F6F4] px-4 pb-24"
    >
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="text-center">

          <div className="inline-flex rounded-full bg-[#FFF1F4] px-4 py-2 text-sm font-bold text-[#6D1F2F]">
            Depoimentos
          </div>

          <h2 className="mt-6 text-4xl font-black leading-tight text-black md:text-6xl">
            Restaurantes que já{" "}
            <span className="text-[#6D1F2F]">
              vendem mais
            </span>
            <br />
            com o MeuCardapioApp
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-zinc-600">
            Clientes reais utilizando a plataforma diariamente.
          </p>
        </div>

        {/* CARDS */}
        <div className="mt-16 grid gap-6 lg:grid-cols-3">

          {[
            {
              image: "/images/testimonials/user2.jpg",
              name: "Lucas Martins",
              company: "Vyora Açaí",
              text: "Aumentamos 40% das vendas no primeiro mês usando o cardápio digital.",
            },
            {
              image: "/images/testimonials/user1.jpg",
              name: "Mariana Silva",
              company: "Doce Encanto",
              text: "Fácil de usar, rápido de configurar e o suporte é incrível.",
            },
            {
              image: "/images/testimonials/user3.jpg",
              name: "Diego Souza",
              company: "Burger House",
              text: "Melhor investimento que fizemos no nosso restaurante.",
            },
          ].map((item) => (
            <div
              key={item.name}
              className="rounded-[2rem] border border-[#ECE7E3] bg-white p-7 shadow-sm transition hover:-translate-y-2 hover:shadow-xl"
            >

              {/* TOPO */}
              <div className="flex items-center gap-4">

                <div className="relative h-20 w-20 overflow-hidden rounded-2xl">

                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div>
                  <h3 className="text-xl font-black text-black">
                    {item.name}
                  </h3>

                  <p className="text-zinc-500">
                    {item.company}
                  </p>

                  <div className="mt-2 flex items-center gap-1 text-yellow-500">

                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        fill="currentColor"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* TEXTO */}
              <p className="mt-8 text-lg leading-relaxed text-zinc-600">
                “{item.text}”
              </p>
            </div>
          ))}
        </div>

        {/* BOLINHAS */}
        <div className="mt-10 flex items-center justify-center gap-3">

          <div className="h-3 w-3 rounded-full bg-[#6D1F2F]" />

          <div className="h-3 w-3 rounded-full bg-zinc-300" />

          <div className="h-3 w-3 rounded-full bg-zinc-300" />

          <div className="h-3 w-3 rounded-full bg-zinc-300" />
        </div>
      </div>
    </section>
  )
}