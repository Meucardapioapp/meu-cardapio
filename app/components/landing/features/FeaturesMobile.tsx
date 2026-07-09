"use client";

import {
  ArrowRight,
  CheckCircle2,
  Wallet,
  LayoutDashboard,
  ShoppingBag,
  Link2,
  TrendingUp,
} from "lucide-react";

import Link from "next/link";

const passos = [
  {
    icon: CheckCircle2,
    titulo: "Crie sua conta gratuitamente",
    descricao:
      "Cadastre seu restaurante em poucos minutos e comece imediatamente.",
  },
  {
    icon: LayoutDashboard,
    titulo: "Painel completo",
    descricao:
      "Receba pedidos, acompanhe vendas, clientes, faturamento e crescimento em tempo real.",
  },
  {
    icon: ShoppingBag,
    titulo: "Cardápio profissional",
    descricao:
      "Um cardápio estudado para aumentar a conversão, facilitar os pedidos e vender mais.",
  },
  {
    icon: Link2,
    titulo: "Link personalizado",
    descricao:
      "Receba um link exclusivo com o nome do seu delivery para divulgar no WhatsApp, Instagram e Google.",
  },
  {
    icon: Wallet,
    titulo: "Economize milhares",
    descricao:
      "Pare de perder dinheiro com altas taxas dos marketplaces e transforme esse valor em lucro.",
  },
  {
    icon: TrendingUp,
    titulo: "Aumente seu faturamento",
    descricao:
      "Mais vendas, mais clientes recorrentes e muito mais controle do seu negócio.",
  },
];

export default function FeaturesMobile() {
  return (
    <section className="bg-[#F8F6F4] px-5 pt-0 py-16">

      {/* Título */}

      <h2 className="mx-auto mt-5 max-w-sm text-center text-[34px] font-black leading-tight text-[#111111]">

        Tudo que você precisa para vender mais

      </h2>

      <p className="mx-auto mt-5 max-w-md text-center text-[17px] leading-8 text-zinc-600">

        Você cria sua conta gratuitamente e recebe uma plataforma completa para administrar seu delivery sem depender de marketplaces.

      </p>

      {/* Cards */}

      <div className="mt-10 space-y-4"> 

                {passos.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.titulo}
              className="rounded-3xl border border-[#E7E2DD] bg-white p-5 shadow-sm"
            >
              <div className="flex gap-4">

                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#6D1F2F]">

                  <Icon
                    size={28}
                    className="text-white"
                  />

                </div>

                <div>

                  <h3 className="text-[18px] font-black text-[#111111]">
                    {item.titulo}
                  </h3>

                  <p className="mt-2 text-[15px] leading-7 text-zinc-600">
                    {item.descricao}
                  </p>

                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Economia */}

            <div className="mt-8 overflow-hidden rounded-[32px] bg-gradient-to-br from-[#6D1F2F] via-[#5A1827] to-[#321017] p-7 text-white shadow-2xl">

        <h3 className="mt-6 text-[30px] font-black leading-tight">
          Economize até
          <br />
          R$ 10.000/mês
        </h3>

        <p className="mt-5 text-[16px] leading-8 text-white/90">
          Deliverys pequenos economizam entre
          <strong> R$ 2.000 e R$ 5.000 por mês</strong>,
          deixando de pagar taxas abusivas dos marketplaces.
        </p>

        <div className="mt-7 space-y-4">

          <div className="flex items-start gap-3">

            <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[#6D1F2F]">

              <CheckCircle2 size={16} />

            </div>

            <p className="leading-7 text-white/90">
              Todo esse valor deixa de ir para taxas e passa a ser
              <strong> lucro líquido</strong> para o seu restaurante.
            </p>

          </div>

          <div className="flex items-start gap-3">

            <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[#6D1F2F]">

              <CheckCircle2 size={16} />

            </div>

            <p className="leading-7 text-white/90">
              Quanto maior for o seu faturamento,
              <strong> maior será a economia</strong>.
            </p>

          </div>

          <div className="flex items-start gap-3">

            <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[#6D1F2F]">

              <CheckCircle2 size={16} />

            </div>

            <p className="leading-7 text-white/90">
              Seu dinheiro permanece no seu negócio para investir em
              marketing, estrutura e crescimento.
            </p>


            

          </div>

        </div>

      </div>

    </section>
  );
}