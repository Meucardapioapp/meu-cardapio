"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import Image from "next/image";

export default function HeroDesktop() {
  const beneficios = [
    "Receba pagamentos com cartão online e receba em até 1 dia util na sua conta.",
    "Aceite Pix e receba direto na sua conta.",
    "Seu próprio link para divulgar no WhatsApp, Instagram e Google.",
    "Configure tudo em menos de 5 minutos.",
    "Sem mensalidade e sem burocracia.",
  ];

  return (
    <section className="relative overflow-hidden bg-[#F8F6F4] pt-36 pb-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(109,31,47,0.06),transparent_40%)]" />

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-20 px-8">

        {/* ESQUERDA */}
        <div className="max-w-xl">

          <h1 className="text-7xl font-black leading-none tracking-[-0.04em] text-[#111111]">
            Tenha seu
            <br />
            <span className="text-[#6D1F2F]">
              cardápio digital
            </span>
            <br />
            sem mensalidade
          </h1>

          <p className="mt-8 text-2xl leading-10 text-zinc-600">
            Em menos de
            <span className="font-bold text-[#6D1F2F]">
              {" "}5 minutos{" "}
            </span>
            você já está pronto para vender.
          </p>

          <div className="mt-10 space-y-5">
            {beneficios.map((item) => (
              <div key={item} className="flex items-center gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6D1F2F]">
                  <Check size={18} className="text-white" />
                </div>

                <span className="text-lg text-zinc-700">
                  {item}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex gap-4">

            <Link
              href="/cadastro"
              className="flex items-center gap-2 rounded-2xl bg-[#6D1F2F] px-8 py-5 text-lg font-bold text-white transition hover:bg-[#531723]"
            >
              Criar meu cardápio

              <ArrowRight size={20} />
            </Link>

            <Link
              href="/fornadapizzaria"
              className="flex items-center text-lg font-semibold text-[#6D1F2F]"
            >
              Ver demonstração →
            </Link>

          </div>

        </div>

      {/* DIREITA */}

<div className="relative flex flex-1 items-center justify-center">

  {/* Glow */}
  <div className="absolute h-[700px] w-[700px] rounded-full bg-[#6D1F2F]/10 blur-[120px]" />

  {/* Sombra */}
  <div className="absolute h-[760px] w-[380px] rounded-[70px] bg-black/20 blur-3xl" />

  {/* iPhone */}
  <div
    className="
      relative
      rotate-[7deg]
      transition-all
      duration-700
      hover:rotate-0
      hover:scale-105
    "
  >

    {/* Moldura */}
    <div className="rounded-[50px] bg-black p-[5px] shadow-[0_40px_90px_rgba(0,0,0,.35)]">

      {/* Dynamic Island */}
<div className="absolute left-1/2 top-4 z-30 h-5 w-24 -translate-x-1/2 rounded-full bg-[#0f0f10]" />
      <Image
        src="/hero/cardapio.webp.jpeg"
        alt="MeuCardápioApp"
        width={420}
        height={900}
        priority
        className="
          rounded-[46px]
          object-cover
          w-[355px]
          h-auto
          select-none
        "
      />

    </div>

  </div>

</div>

</div>
    </section>
  );
}