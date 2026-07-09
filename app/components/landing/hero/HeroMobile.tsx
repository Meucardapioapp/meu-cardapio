"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  CreditCard,
  Wallet,
  QrCode,
} from "lucide-react";

export default function HeroMobile() {
  const beneficios = [
    "Receba pagamentos com cartão online sem precisar de maquininha.",
    "Aceite Pix e receba direto na sua conta.",
    "Seu próprio link para divulgar no WhatsApp, Instagram e Google.",
    "Configure tudo em menos de 5 minutos.",
    "Sem mensalidade e sem burocracia.",
  ];

  return (
    <section className="relative overflow-hidden bg-[#F8F6F4] pt-6 pb-16">

      {/* Fundo */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(109,31,47,0.05),transparent_45%)]" />

      <div className="mx-auto flex w-full max-w-xl flex-col px-6">

        {/* TÍTULO */}

<h1 className="text-center text-[32px] font-black tracking-[-0.03em] text-[#111111] md:text-6xl">

  <span className="text-[#111111]">
    O
  </span>{" "}

  <span className="text-[#6D1F2F]">
    Cardápio Digital
  </span>

  <div className="mt-1">
    Que faz você vender mais
  </div>

</h1>

        {/* SUBTÍTULO */}

        <p className="mt-5 text-center text-xl leading-8 text-zinc-600">

          Em menos de

          <span className="font-bold text-[#6D1F2F]">
            {" "}5 minutos{" "}
          </span>

          você já está pronto para vender.

        </p>

        {/* BENEFÍCIOS */}

        <div className="mt-8 space-y-4">

          {beneficios.map((item) => (

            <div
              key={item}
              className="flex items-start gap-3"
            >

              <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6D1F2F]">

                <Check
                  size={16}
                  className="text-white"
                />

              </div>

              <p className="text-base leading-7 text-zinc-700">
                {item}
              </p>

            </div>

          ))}

        </div>

        {/* BOTÕES */}

        <div className="mt-10 flex flex-col gap-3">

          <Link
            href="/cadastro"
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#6D1F2F] px-6 py-4 text-lg font-bold text-white transition hover:bg-[#531723]"
          >
            Criar meu cardápio

            <ArrowRight size={20} />
          </Link>

          <Link
            href="/demo"
            className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-6 py-4 text-lg font-semibold text-[#6D1F2F] shadow-sm transition hover:bg-zinc-50"
          >
            Ver demonstração

            <ArrowRight size={18} />
          </Link>

        </div>

        {/* FORMAS DE PAGAMENTO */}

        <div className="mt-6 rounded-3xl border border-[#E9E2DD] bg-white p-6 shadow-md">

          <h3 className="text-center text-xl font-bold text-[#111111]">
            Formas de pagamento
          </h3>

          <p className="mt-2 text-center text-sm text-zinc-500">
            Aceite pagamentos online ou na entrega.
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3">

            <div className="flex flex-col items-center rounded-2xl bg-[#F8F6F4] p-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6D1F2F]/10">

                <QrCode
                  size={24}
                  className="text-[#6D1F2F]"
                />

              </div>

              <span className="mt-3 text-sm font-bold">
                Pix
              </span>

            </div>

            <div className="flex flex-col items-center rounded-2xl bg-[#F8F6F4] p-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6D1F2F]/10">

                <CreditCard
                  size={24}
                  className="text-[#6D1F2F]"
                />

              </div>

              <span className="mt-3 text-sm font-bold">
                Cartão
              </span>

            </div>

            <div className="flex flex-col items-center rounded-2xl bg-[#F8F6F4] p-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6D1F2F]/10">

                <Wallet
                  size={24}
                  className="text-[#6D1F2F]"
                />

              </div>

              <span className="mt-3 text-sm font-bold">
                Dinheiro
              </span>

            </div>

          </div>
                  </div>

      </div>

      {/* DETALHES DE FUNDO */}

      <div className="pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-[#6D1F2F]/5 blur-3xl" />

      <div className="pointer-events-none absolute bottom-0 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[#6D1F2F]/5 blur-3xl" />

    </section>
  );
}