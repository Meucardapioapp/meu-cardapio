"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

export default function PrimeirosPassosPage() {
  return (
    <main className="min-h-screen bg-[#F7F5F4] p-6">

      <div className="max-w-7xl mx-auto">

        {/* Cabeçalho */}

        <div className="bg-white rounded-3xl border shadow-sm p-8">

          <h1 className="text-4xl font-black text-[#22181C]">
            Primeiros Passos
          </h1>

          <p className="mt-3 text-zinc-500 text-lg">
            Configure seu cardápio seguindo a ordem abaixo.
            Em poucos minutos seu restaurante estará pronto
            para começar a vender.
          </p>

        </div>

        {/* IMAGEM */}

        <div className="mt-8 overflow-hidden rounded-3xl border shadow bg-white">

<img
  src="/primeiros-passos.png"
  alt="Primeiros Passos"
  className="w-full"
/>

        </div>

{/* CONFIGURAÇÃO RÁPIDA */}

<div className="mt-8">

  <h2 className="text-3xl font-black text-[#22181C] mb-2">
    Continue a configuração
  </h2>

  <p className="text-zinc-500 mb-8">
    Siga esta ordem para terminar seu cardápio.
  </p>

  <div className="grid lg:grid-cols-2 gap-5">

    <CardPasso numero="1" titulo="Aparência" descricao="Logo, banner, nome, pedido mínimo e identidade visual." link="/admin/aparencia"/>

    <CardPasso numero="2" titulo="Horários" descricao="Dias da semana e horário de funcionamento." link="/admin/horarios"/>

    <CardPasso numero="3" titulo="Categorias" descricao="Crie categorias como Pizzas, Bebidas e Sobremesas." link="/admin/categorias"/>

    <CardPasso numero="4" titulo="Produtos" descricao="Cadastre fotos, descrição e preços." link="/admin/produtos"/>

    <CardPasso numero="5" titulo="Dados Bancários" descricao="Configure onde receber seus pagamentos." link="/admin/dados-bancarios"/>

    <CardPasso numero="6" titulo="Endereço" descricao="Defina o endereço para calcular a entrega." link="/admin/restaurante"/>

    <CardPasso numero="7" titulo="Taxa de Entrega" descricao="Entrega grátis, fixa ou por distância." link="/admin/entrega"/>

    <CardPasso numero="8" titulo="Pagamentos" descricao="Escolha PIX, Cartão e outros meios." link="/admin/pagamentos"/>

  </div>

</div>

 {/* CHECKLIST FINAL */}

<div className="mt-8 rounded-3xl border bg-white shadow-sm overflow-hidden">

  <div className="border-b px-8 py-6 bg-gradient-to-r from-[#6D1F2F] to-[#8A2340]">

    <h2 className="text-3xl font-black text-white">
       Antes de divulgar seu cardápio
    </h2>

    <p className="mt-2 text-white/80">
      Confira estes itens para garantir que seus clientes tenham uma boa experiência.
    </p>

  </div>

  <div className="grid lg:grid-cols-2 gap-5 p-8">

    <ChecklistItem
      titulo="Logo e Banner"
      descricao="Utilize imagens bonitas e em alta qualidade."
    />

    <ChecklistItem
      titulo="Produtos"
      descricao="Cadastre fotos reais, preços e descrições completas."
    />

    <ChecklistItem
      titulo="Horários"
      descricao="Confira se o restaurante abrirá corretamente."
    />

    <ChecklistItem
      titulo="Taxa de entrega"
      descricao="Faça um teste para validar o cálculo do frete."
    />

    <ChecklistItem
      titulo="Pagamentos"
      descricao="Verifique se PIX e Cartão estão funcionando."
    />

    <ChecklistItem
      titulo="Pedido de teste"
      descricao="Faça um pedido completo antes de divulgar seu link."
    />

  </div>

</div>

        {/* WHATSAPP */}

        <div className="mt-8 rounded-3xl bg-green-50 border border-green-200 p-10">

          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">

            <div>

              <h2 className="text-3xl font-black text-[#22181C]">
                Ainda ficou com alguma dúvida?
              </h2>

              <p className="mt-3 text-zinc-700 leading-7 max-w-2xl">
                Caso tenha qualquer dificuldade durante a criação
                do seu cardápio, nossa equipe está pronta para ajudar.
                Basta clicar no botão abaixo e falar conosco pelo
                WhatsApp.
              </p>

            </div>

            <Link
              href="https://wa.me/5592992338863"
              target="_blank"
              className="
                flex
                items-center
                gap-3
                rounded-2xl
                bg-green-600
                hover:bg-green-700
                text-white
                font-bold
                px-8
                py-4
                transition
              "
            >
              <MessageCircle size={24} />

              Falar no WhatsApp

              <ArrowRight size={18} />
            </Link>

          </div>

        </div>

      </div>

    </main>
  );
}

type ItemProps = {
  numero: string;
  titulo: string;
  descricao: string;
};

function CardPasso({
  numero,
  titulo,
  descricao,
  link,
}: {
  numero: string;
  titulo: string;
  descricao: string;
  link: string;
}) {
  return (
    <Link
      href={link}
      className="
        group
        rounded-3xl
        bg-white
        border
        shadow-sm
        p-6
        hover:border-[#6D1F2F]
        hover:shadow-xl
        transition-all
      "
    >
      <div className="flex justify-between items-start">

        <div>

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-full bg-[#6D1F2F] text-white flex items-center justify-center font-bold">
              {numero}
            </div>

            <h3 className="text-2xl font-black">
              {titulo}
            </h3>

          </div>

          <p className="mt-4 text-zinc-600 leading-7">
            {descricao}
          </p>

        </div>

        <ArrowRight
          className="
            text-[#6D1F2F]
            group-hover:translate-x-1
            transition
          "
        />

      </div>

      <div className="mt-6 font-semibold text-[#6D1F2F]">
        Configurar agora →
      </div>

    </Link>
  );
}

function ChecklistItem({
  titulo,
  descricao,
}: {
  titulo: string;
  descricao: string;
}) {
  return (
    <div
      className="
        flex
        gap-4
        rounded-2xl
        border
        p-5
        hover:border-[#6D1F2F]
        transition
      "
    >
      <div className="text-3xl">
        ✅
      </div>

      <div>

        <h3 className="font-bold text-lg text-[#22181C]">
          {titulo}
        </h3>

        <p className="mt-1 text-zinc-600">
          {descricao}
        </p>

      </div>

    </div>
  );
}