"use client"

import {
  ChevronDown,
} from "lucide-react"

export default function FAQDesktop() {
  return (
    <section
      id="faq"
      className="bg-[#F8F6F4] px-4 pb-24"
    >
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <div className="text-center">

          <div className="inline-flex rounded-full bg-[#FFF1F4] px-4 py-2 text-sm font-bold text-[#6D1F2F]">
          </div>

          <h2 className="mt-6 text-4xl font-black leading-tight text-black md:text-6xl">
            Perguntas{" "}
            <span className="text-[#6D1F2F]">
              frequentes
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600">
            Tire suas dúvidas sobre o MeuCardapioApp.
          </p>
        </div>

        {/* FAQ LIST */}
        <div className="mt-16 space-y-5">

          {[
            
            {
              question: "Posso aceitar Pix e cartão?",
              answer:
                "Sim. O sistema permite pagamentos online via Pix, crédito e débito.",
            },
            {
              question: "Funciona no celular?",
              answer:
                "Sim. O cardápio é totalmente responsivo para qualquer dispositivo.",
            },
            {
              question: "Posso personalizar meu cardápio?",
              answer:
                "Sim. Você pode alterar cores, imagens, categorias e identidade visual.",
            },
            {
              question: "O sistema envia pedidos no WhatsApp?",
              answer:
                "Sim. Os pedidos podem ser enviados automaticamente para o WhatsApp.",
            },
            {
              question: "Posso cancelar quando eu quiser?",
              answer:
                "Sim, Você pode cancelar quando quiser.",
            },
          ].map((item) => (
            <div
              key={item.question}
              className="overflow-hidden rounded-[2rem] border border-[#ECE7E3] bg-white shadow-sm"
            >

              <button className="flex w-full items-center justify-between gap-6 px-6 py-6 text-left md:px-8">

                <div>
                  <h3 className="text-lg font-black text-black md:text-xl">
                    {item.question}
                  </h3>

                  <p className="mt-3 max-w-3xl leading-relaxed text-zinc-600">
                    {item.answer}
                  </p>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF1F4] text-[#6D1F2F]">
                  <ChevronDown size={22} />
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}