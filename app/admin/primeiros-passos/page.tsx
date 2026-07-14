"use client";

import Link from "next/link";
import {
  Rocket,
  FolderOpen,
  Hamburger,
  Palette,
  Clock3,
  MapPin,
  Bike,
  CreditCard,
  Landmark,
  Link2,
  CheckCircle2,
} from "lucide-react";

export default function PrimeirosPassosPage() {
  const progresso = 78;

  return (
    <main className="min-h-screen bg-[#F7F5F4] p-6">

      <div className="max-w-[1450px] mx-auto">

        {/* HEADER */}

        <div className="bg-white rounded-[28px] shadow-sm border border-zinc-200 p-7">

          <div className="flex items-center">

            <div>

              <div className="flex items-center gap-3">

                <div
                  className="
                  w-12
                  h-12
                  rounded-xl
                  bg-[#FCEBED]
                  flex
                  items-center
                  justify-center
                "
                >
                  <Rocket
                    className="text-[#8B1538]"
                    size={26}
                  />
                </div>

                <div>

                  <h1
                    className="
                    text-4xl
                    font-black
                    text-[#22181C]
                  "
                  >
                    Bem-vindo ao MeuCardápio!
                  </h1>

                  <p
                    className="
                    mt-2
                    text-base
                    leading-6
                    text-sm text-zinc-500
                    max-w-[650px]
                  "
                  >
                    Siga este passo a passo para configurar seu
                    cardápio e começar a receber pedidos.
                  </p>

                </div>

              </div>

            </div>

            

          </div>

        </div>

        
        {/* GRID DOS CARDS */}

        <div
          className="
          mt-5
          grid
          grid-cols-1
          xl:grid-cols-3
          gap-7
        "
        >

{/* ================= CARD 1 ================= */}

<div
  className="
  bg-white
  rounded-[30px]
  border
  border-zinc-200
  shadow-sm
  hover:shadow-xl
  transition-all
  duration-300
  overflow-hidden
"
>

  {/* TOPO */}

  <div className="p-6 pb-0">

    <div
      className="
      w-20
      h-20
      rounded-3xl
      bg-[#FCEBED]
      flex
      items-center
      justify-center
      mb-4
    "
    >

      <FolderOpen
        size={42}
        className="text-[#8B1538]"
      />

    </div>

    <div className="flex items-center justify-between">

      <h2
        className="
        text-[22px]
        font-black
        text-[#22181C]
      "
      >
        Criar Categorias
      </h2>

      <span
        className="
        px-3
        py-1
        rounded-full
        bg-orange-100
        text-orange-700
        font-bold
        text-xs
      "
      >
        Pendente
      </span>

    </div>

    <p
      className="
      mt-2
      text-[17px]
      leading-6
      text-zinc-600
    "
    >
      Antes de cadastrar qualquer produto,
      você precisa criar pelo menos
      uma categoria.

      Sem isso o sistema não conseguirá
      salvar seus produtos.
    </p>

  </div>

  {/* AVISO */}

  <div
    className="
    mx-6
    mt-5
    rounded-xl
    bg-[#FFF8E8]
    border
    border-[#FFE4A3]
    p-4
  "
  >

    <p
      className="
      font-bold
      text-[#A16207]
      mb-2
    "
    >
      ⚠ Importante
    </p>

    <p
      className="
      text-sm
      leading-6
      text-[#854D0E]
    "
    >
      Se nenhuma categoria for criada,
      será impossível cadastrar produtos.
    </p>

  </div>

  {/* PASSOS */}

  <div className="px-6 mt-5">

    <h3
      className="
      text-base
      font-bold
      mb-4
    "
    >
      Passo a passo
    </h3>

    <div className="space-y-4">

      <div className="flex gap-3">

        <div
          className="
          w-7
          h-7
          rounded-full
          bg-[#8B1538]
          text-white
          font-bold
          flex
          items-center
          justify-center
          shrink-0
        "
        >
          1
        </div>

        <div>

          <p className="font-medium text-[15px]">
            Vá até o menu Categorias
          </p>

          <p className="text-sm text-zinc-500">
            Clique em Categorias no menu lateral.
          </p>

        </div>

      </div>

      <div className="flex gap-3">

        <div
          className="
          w-7
          h-7
          rounded-full
          bg-[#8B1538]
          text-white
          font-bold
          flex
          items-center
          justify-center
          shrink-0
        "
        >
          2
        </div>

        <div>

          <p className="font-medium text-[15px]">
            Clique em Nova Categoria
          </p>

          <p className="text-sm text-zinc-500">
            Será aberta a tela para cadastro.
          </p>

        </div>

      </div>

      <div className="flex gap-3">

        <div
          className="
          w-7
          h-7
          rounded-full
          bg-[#8B1538]
          text-white
          font-bold
          flex
          items-center
          justify-center
          shrink-0
          "
        >
          3
        </div>

        <div>

          <p className="font-medium text-[15px]">
            Digite o nome da categoria
          </p>

          <p className="text-sm text-zinc-500">
            Ex.: Hambúrgueres, Bebidas,
            Pizzas ou Sobremesas.
          </p>

        </div>

      </div>

      <div className="flex gap-3">

        <div
          className="
          w-7
          h-7
          rounded-full
          bg-[#8B1538]
          text-white
          font-bold
          flex
          items-center
          justify-center
          shrink-0
        "
        >
          4
        </div>

        <div>

          <p className="font-medium text-[15px]">
            Clique em Salvar Categoria
          </p>

          <p className="text-sm text-zinc-500">
            Após salvar, você já poderá
            cadastrar produtos normalmente.
          </p>

        </div>

      </div>

    </div>

  </div>

  {/* BOTÃO */}

  <div className="p-6">

    <Link
      href="/admin/categorias"
      className="
      h-11
      rounded-xl
      bg-[#8B1538]
      hover:bg-[#73122F]
      transition
      text-white
      font-bold
      flex
      items-center
      justify-center
      text-base
      w-full
    "
    >
      Ir para Categorias
    </Link>

  </div>

</div>

{/* ================= CARD 2 ================= */}

<div
  className="
  bg-white
  rounded-[30px]
  border
  border-zinc-200
  shadow-sm
  hover:shadow-xl
  transition-all
  duration-300
  overflow-hidden
"
>

  <div className="p-6 pb-0">

    <div
      className="
      w-20
      h-20
      rounded-3xl
      bg-[#FCEBED]
      flex
      items-center
      justify-center
      mb-4
    "
    >

      <Hamburger
        size={42}
        className="text-[#8B1538]"
      />

    </div>

    <div className="flex items-center justify-between">

      <h2 className="text-[22px] font-black text-[#22181C]">
        Criar Produtos
      </h2>

      <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-bold text-xs">
        Pendente
      </span>

    </div>

    <p className="mt-2 text-[17px] leading-6 text-zinc-600">

      Agora que já existe uma categoria,
      você pode cadastrar os produtos
      que aparecerão para seus clientes.

    </p>

  </div>

  <div
    className="
    mx-6
    mt-5
    rounded-xl
    bg-[#EEF8FF]
    border
    border-[#CDEBFF]
    p-4
  "
  >

    <p className="font-bold text-sky-700 mb-2">
      💡 Dica
    </p>

    <p className="text-sm leading-6 text-sky-800">

      Utilize boas fotos e uma descrição
      completa para aumentar suas vendas.

    </p>

  </div>

  <div className="px-6 mt-5">

    <h3 className="text-base font-bold mb-4">
      Passo a passo
    </h3>

    <div className="space-y-4">

      <div className="flex gap-3">

        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          1
        </div>

        <div>

          <p className="font-medium text-[15px]">
            Vá até Produtos
          </p>

          <p className="text-sm text-zinc-500">
            Clique em Produtos no menu lateral.
          </p>

        </div>

      </div>

      <div className="flex gap-3">

        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          2
        </div>

        <div>

          <p className="font-medium text-[15px]">
            Clique em Novo Produto
          </p>

          <p className="text-sm text-zinc-500">
            Abrirá a tela de cadastro.
          </p>

        </div>

      </div>

      <div className="flex gap-3">

        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          3
        </div>

        <div>

          <p className="font-medium text-[15px]">
            Preencha todas as informações
          </p>

          <p className="text-sm text-zinc-500">
            Nome, preço, categoria,
            descrição e imagem.
          </p>

        </div>

      </div>

      <div className="flex gap-3">

        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          4
        </div>

        <div>

          <p className="font-medium text-[15px]">
            Clique em Salvar Produto
          </p>

          <p className="text-sm text-zinc-500">
            Seu produto ficará disponível
            no cardápio.
          </p>

        </div>

      </div>

    </div>

  </div>

  <div className="p-6">

    <Link
      href="/admin/produtos"
      className="
      h-11
      rounded-xl
      bg-[#8B1538]
      hover:bg-[#73122F]
      transition
      text-white
      font-bold
      flex
      items-center
      justify-center
      text-base
      w-full
    "
    >
      Ir para Produtos
    </Link>

  </div>

</div>

{/* ================= CARD 3 ================= */}

<div
  className="
  bg-white
  rounded-[30px]
  border
  border-zinc-200
  shadow-sm
  hover:shadow-xl
  transition-all
  duration-300
  overflow-hidden
"
>

  <div className="p-6 pb-0">

    <div
      className="
      w-20
      h-20
      rounded-3xl
      bg-[#FCEBED]
      flex
      items-center
      justify-center
      mb-4
    "
    >

      <Palette
        size={42}
        className="text-[#8B1538]"
      />

    </div>

    <div className="flex items-center justify-between">

      <h2 className="text-[22px] font-black text-[#22181C]">
        Personalizar Cardápio
      </h2>

      <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-bold text-xs">
        Pendente
      </span>

    </div>

    <p className="mt-2 text-[17px] leading-6 text-zinc-600">

      Agora personalize seu cardápio com a
      identidade visual do seu restaurante.

    </p>

  </div>

  <div
    className="
    mx-6
    mt-5
    rounded-xl
    bg-[#FFF8E8]
    border
    border-[#FFE4A3]
    p-4
  "
  >

    <p className="font-bold text-[#A16207] mb-2">
      🎨 Personalização
    </p>

    <p className="text-sm leading-6 text-[#854D0E]">

      Essas informações aparecerão para
      todos os seus clientes.

    </p>

  </div>

  <div className="px-6 mt-5">

    <h3 className="text-base font-bold mb-4">
      Passo a passo
    </h3>

    <div className="space-y-4">

      <div className="flex gap-3">

        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          1
        </div>

        <div>

          <p className="font-medium text-[15px]">
            Vá em Aparência
          </p>

          <p className="text-sm text-zinc-500">
            Clique em Aparência no menu.
          </p>

        </div>

      </div>

      <div className="flex gap-3">

        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          2
        </div>

        <div>

          <p className="font-medium text-[15px]">
            Preencha os dados
          </p>

          <p className="text-sm text-zinc-500">
            Categoria, pedido mínimo,
            nome e atendimento.
          </p>

        </div>

      </div>

      <div className="flex gap-3">

        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          3
        </div>

        <div>

          <p className="font-medium text-[15px]">
            Escolha a cor principal
          </p>

          <p className="text-sm text-zinc-500">
            Você pode usar vinho,
            preto ou qualquer outra cor.
          </p>

        </div>

      </div>

      <div className="flex gap-3">

        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          4
        </div>

        <div>

          <p className="font-medium text-[15px]">
            Envie sua logo e banner
          </p>

          <p className="text-sm text-zinc-500">
            Utilize imagens em alta qualidade.
          </p>

        </div>

      </div>

      <div className="flex gap-3">

        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          5
        </div>

        <div>

          <p className="font-medium text-[15px]">
            Clique em Salvar Alterações
          </p>

          <p className="text-sm text-zinc-500">
            O visual será atualizado
            imediatamente.
          </p>

        </div>

      </div>

    </div>

  </div>

  <div className="p-6">

    <Link
      href="/admin/aparencia"
      className="
      h-11
      rounded-xl
      bg-[#8B1538]
      hover:bg-[#73122F]
      transition
      text-white
      font-bold
      flex
      items-center
      justify-center
      text-base
      w-full
    "
    >
      Ir para Aparência
    </Link>

  </div>

</div>

{/* FIM DA PRIMEIRA LINHA DO GRID */}

</div>

{/* ================= SEGUNDA LINHA ================= */}

<div
  className="
  mt-7
  grid
  grid-cols-1
  xl:grid-cols-3
  gap-7
"
>

{/* ================= CARD 4 ================= */}

<div
  className="
  bg-white
  rounded-[30px]
  border
  border-zinc-200
  shadow-sm
  hover:shadow-xl
  transition-all
  duration-300
  overflow-hidden
"
>

  <div className="p-6 pb-0">

    <div
      className="
      w-20
      h-20
      rounded-3xl
      bg-[#FCEBED]
      flex
      items-center
      justify-center
      mb-4
    "
    >

      <Clock3
        size={42}
        className="text-[#8B1538]"
      />

    </div>

    <div className="flex items-center justify-between">

      <h2
        className="
        text-[22px]
        font-black
        text-[#22181C]
      "
      >
        Horários
      </h2>

      <span
        className="
        px-3
        py-1
        rounded-full
        bg-orange-100
        text-orange-700
        font-bold
        text-xs
      "
      >
        Pendente
      </span>

    </div>

    <p
      className="
      mt-2
      text-[17px]
      leading-6
      text-zinc-600
    "
    >
      Informe corretamente os horários
      de funcionamento para que seus
      clientes saibam quando sua loja
      está aberta.
    </p>

  </div>

  <div
    className="
    mx-6
    mt-5
    rounded-xl
    bg-[#EEF8FF]
    border
    border-[#CDEBFF]
    p-4
  "
  >

    <p className="font-bold text-sky-700 mb-2">
      💡 Dica
    </p>

    <p
      className="
      text-sm
      leading-6
      text-sky-800
    "
    >
      Marque como fechado os dias que
      seu restaurante não funciona.
    </p>

  </div>

  <div className="px-6 mt-5">

    <h3
      className="
      text-base
      font-bold
      mb-4
    "
    >
      Passo a passo
    </h3>

    <div className="space-y-4">

      <div className="flex gap-3">

        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          1
        </div>

        <div>

          <p className="font-medium text-[15px]">
            Vá até Horários
          </p>

          <p className="text-sm text-zinc-500">
            Clique em Horários no menu lateral.
          </p>

        </div>

      </div>

      <div className="flex gap-3">

        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          2
        </div>

        <div>

          <p className="font-medium text-[15px]">
            Informe abertura
          </p>

          <p className="text-sm text-zinc-500">
            Defina o horário que sua loja abre.
          </p>

        </div>

      </div>

      <div className="flex gap-3">

        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          3
        </div>

        <div>

          <p className="font-medium text-[15px]">
            Informe fechamento
          </p>

          <p className="text-sm text-zinc-500">
            Defina o horário de encerramento.
          </p>

        </div>

      </div>

      <div className="flex gap-3">

        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          4
        </div>

        <div>

          <p className="font-medium text-[15px]">
            Marque dias fechados
          </p>

          <p className="text-sm text-zinc-500">
            Caso exista algum dia sem atendimento.
          </p>

        </div>

      </div>

      <div className="flex gap-3">

        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          5
        </div>

        <div>

          <p className="font-medium text-[15px]">
            Clique em Salvar
          </p>

          <p className="text-sm text-zinc-500">
            Os horários aparecerão para seus clientes.
          </p>

        </div>

      </div>

    </div>

  </div>

  <div className="p-6">

    <Link
      href="/admin/horarios"
      className="
      h-11
      rounded-xl
      bg-[#8B1538]
      hover:bg-[#73122F]
      transition
      text-white
      font-bold
      flex
      items-center
      justify-center
      text-base
      w-full
    "
    >
      Ir para Horários
    </Link>

  </div>

</div>

{/* ================= CARD 5 ================= */}

<div
  className="
  bg-white
  rounded-[30px]
  border
  border-zinc-200
  shadow-sm
  hover:shadow-xl
  transition-all
  duration-300
  overflow-hidden
"
>

  <div className="p-6 pb-0">

    <div className="w-20 h-20 rounded-3xl bg-[#FCEBED] flex items-center justify-center mb-4">

      <MapPin
        size={42}
        className="text-[#8B1538]"
      />

    </div>

    <div className="flex items-center justify-between">

      <h2 className="text-[22px] font-black text-[#22181C]">
        Endereço do Restaurante
      </h2>

      <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-bold text-xs">
        Pendente
      </span>

    </div>

    <p className="mt-2 text-[17px] leading-6 text-zinc-600">

      Cadastre corretamente o endereço
      da sua loja. Essas informações serão
      utilizadas para calcular a taxa de entrega.

    </p>

  </div>

  <div className="mx-6 mt-5 rounded-xl bg-[#EEF8FF] border border-[#CDEBFF] p-4">

    <p className="font-bold text-sky-700 mb-2">
      📍 Importante
    </p>

    <p className="text-sm leading-6 text-sky-800">

      Informe o CEP corretamente para que
      o cálculo da distância funcione.

    </p>

  </div>

  <div className="px-6 mt-5">

    <h3 className="text-base font-bold mb-4">
      Passo a passo
    </h3>

    <div className="space-y-4">

      <div className="flex gap-3">
        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          1
        </div>

        <div>
          <p className="font-medium text-[15px]">Abra Endereço do Restaurante</p>
          <p className="text-sm text-zinc-500">
            Clique no menu lateral.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          2
        </div>

        <div>
          <p className="font-medium text-[15px]">Digite o CEP</p>
          <p className="text-sm text-zinc-500">
            O restante será preenchido automaticamente.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          3
        </div>

        <div>
          <p className="font-medium text-[15px]">Complete os dados</p>
          <p className="text-sm text-zinc-500">
            Número, complemento e referência.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          4
        </div>

        <div>
          <p className="font-medium text-[15px]">Clique em Salvar</p>
          <p className="text-sm text-zinc-500">
            Seu endereço ficará configurado.
          </p>
        </div>
      </div>

    </div>

  </div>

  <div className="p-6">

    <Link
      href="/admin/endereco"
      className="
      h-11
      rounded-xl
      bg-[#8B1538]
      hover:bg-[#73122F]
      transition
      text-white
      font-bold
      flex
      items-center
      justify-center
      text-base
      w-full
    "
    >
      Ir para Endereço
    </Link>

  </div>

</div>

{/* ================= CARD 6 ================= */}

<div
  className="
  bg-white
  rounded-[30px]
  border
  border-zinc-200
  shadow-sm
  hover:shadow-xl
  transition-all
  duration-300
  overflow-hidden
"
>

  <div className="p-6 pb-0">

    <div className="w-20 h-20 rounded-3xl bg-[#FCEBED] flex items-center justify-center mb-4">

      <Bike
        size={42}
        className="text-[#8B1538]"
      />

    </div>

    <div className="flex items-center justify-between">

      <h2 className="text-[22px] font-black text-[#22181C]">
        Taxa de Entrega
      </h2>

      <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-bold text-xs">
        Pendente
      </span>

    </div>

    <p className="mt-2 text-[17px] leading-6 text-zinc-600">

      Escolha como deseja cobrar o frete
      dos seus clientes.

    </p>

  </div>

  <div className="mx-6 mt-5 rounded-xl bg-[#FFF8E8] border border-[#FFE4A3] p-4">

    <p className="font-bold text-[#A16207] mb-2">
      🚚 Opções
    </p>

    <ul className="space-y-2 text-sm leading-6 text-[#854D0E]">

      <li>• Frete grátis</li>

      <li>• Taxa fixa</li>

      <li>• Por distância (faixas de KM)</li>

    </ul>

  </div>

  <div className="px-6 mt-5">

    <h3 className="text-base font-bold mb-4">
      Passo a passo
    </h3>

    <div className="space-y-4">

      <div className="flex gap-3">

        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          1
        </div>

        <div>
          <p className="font-medium text-[15px]">Abra Taxa de Entrega</p>
          <p className="text-sm text-zinc-500">
            Acesse pelo menu lateral.
          </p>
        </div>

      </div>

      <div className="flex gap-3">

        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          2
        </div>

        <div>
          <p className="font-medium text-[15px]">Escolha a forma de cobrança</p>
          <p className="text-sm text-zinc-500">
            Frete grátis, taxa fixa ou distância.
          </p>
        </div>

      </div>

      <div className="flex gap-3">

        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          3
        </div>

        <div>
          <p className="font-medium text-[15px]">Configure os valores</p>
          <p className="text-sm text-zinc-500">
            Adicione quantas faixas desejar.
          </p>
        </div>

      </div>

      <div className="flex gap-3">

        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          4
        </div>

        <div>
          <p className="font-medium text-[15px]">Clique em Salvar</p>
          <p className="text-sm text-zinc-500">
            Sua entrega estará pronta para uso.
          </p>
        </div>

      </div>

    </div>

  </div>

  <div className="p-6">

    <Link
      href="/admin/entrega"
      className="
      h-11
      rounded-xl
      bg-[#8B1538]
      hover:bg-[#73122F]
      transition
      text-white
      font-bold
      flex
      items-center
      justify-center
      text-base
      w-full
    "
    >
      Ir para Taxa de Entrega
    </Link>

  </div>

</div>

</div>

{/* ================= TERCEIRA LINHA ================= */}

<div
  className="
  mt-7
  grid
  grid-cols-1
  xl:grid-cols-3
  gap-7
"
>

{/* ================= CARD 7 ================= */}

<div
  className="
  bg-white
  rounded-[30px]
  border
  border-zinc-200
  shadow-sm
  hover:shadow-xl
  transition-all
  duration-300
  overflow-hidden
"
>

  <div className="p-6 pb-0">

    <div className="w-20 h-20 rounded-3xl bg-[#FCEBED] flex items-center justify-center mb-4">

      <CreditCard
        size={42}
        className="text-[#8B1538]"
      />

    </div>

    <div className="flex items-center justify-between">

      <h2 className="text-[22px] font-black text-[#22181C]">
        Pagamentos
      </h2>

      <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-bold text-xs">
        Pendente
      </span>

    </div>

    <p className="mt-2 text-[17px] leading-6 text-zinc-600">

      Escolha quais formas de pagamento
      deseja aceitar em seu restaurante.

    </p>

  </div>

  <div className="mx-6 mt-5 rounded-xl bg-[#EEF8FF] border border-[#CDEBFF] p-4">

    <p className="font-bold text-sky-700 mb-2">
      💰 Importante
    </p>

    <p className="text-sm leading-6 text-sky-800">

      Você pode ativar dinheiro,
      Pix e cartão conforme desejar.

    </p>

  </div>

  <div className="px-6 mt-5">

    <h3 className="text-base font-bold mb-4">
      Passo a passo
    </h3>

    <div className="space-y-4">

      <div className="flex gap-3">

        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          1
        </div>

        <div>

          <p className="font-medium text-[15px]">
            Abra Pagamentos
          </p>

          <p className="text-sm text-zinc-500">
            Clique em Pagamentos.
          </p>

        </div>

      </div>

      <div className="flex gap-3">

        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          2
        </div>

        <div>

          <p className="font-medium text-[15px]">
            Escolha os meios de pagamento
          </p>

          <p className="text-sm text-zinc-500">
            Ative apenas os que desejar.
          </p>

        </div>

      </div>

      <div className="flex gap-3">

        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          3
        </div>

        <div>

          <p className="font-medium text-[15px]">
            Clique em Salvar
          </p>

          <p className="text-sm text-zinc-500">
            As alterações serão aplicadas.
          </p>

        </div>

      </div>

    </div>

  </div>

  <div className="p-6">

    <Link
      href="/admin/pagamentos"
      className="
      h-11
      rounded-xl
      bg-[#8B1538]
      hover:bg-[#73122F]
      transition
      text-white
      font-bold
      flex
      items-center
      justify-center
      text-base
      w-full
    "
    >
      Ir para Pagamentos
    </Link>

  </div>

</div>

{/* ================= CARD 8 ================= */}

<div
  className="
  bg-white
  rounded-[30px]
  border
  border-zinc-200
  shadow-sm
  hover:shadow-xl
  transition-all
  duration-300
  overflow-hidden
"
>

  <div className="p-6 pb-0">

    <div className="w-20 h-20 rounded-3xl bg-[#FCEBED] flex items-center justify-center mb-4">

      <Landmark
        size={42}
        className="text-[#8B1538]"
      />

    </div>

    <div className="flex items-center justify-between">

      <h2 className="text-[22px] font-black text-[#22181C]">
        Dados Bancários
      </h2>

      <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-bold text-xs">
        Pendente
      </span>

    </div>

    <p className="mt-2 text-[17px] leading-6 text-zinc-600">

      Informe a conta que irá receber
      os pagamentos realizados no Pix.

    </p>

  </div>

  <div className="mx-6 mt-5 rounded-xl bg-[#FFF8E8] border border-[#FFE4A3] p-4">

    <p className="font-bold text-[#A16207] mb-2">
      🏦 Atenção
    </p>

    <p className="text-sm leading-6 text-[#854D0E]">

      Utilize uma conta de sua titularidade
      para evitar problemas no recebimento.

    </p>

  </div>

  <div className="px-6 mt-5">

    <h3 className="text-base font-bold mb-4">
      Passo a passo
    </h3>

    <div className="space-y-4">

      <div className="flex gap-3">

        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          1
        </div>

        <div>

          <p className="font-medium text-[15px]">
            Abra Dados Bancários
          </p>

          <p className="text-sm text-zinc-500">
            Clique no menu lateral.
          </p>

        </div>

      </div>

      <div className="flex gap-3">

        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          2
        </div>

        <div>

          <p className="font-medium text-[15px]">
            Informe Banco, Agência e Conta
          </p>

          <p className="text-sm text-zinc-500">
            Digite todas as informações.
          </p>

        </div>

      </div>

      <div className="flex gap-3">

        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          3
        </div>

        <div>

          <p className="font-medium text-[15px]">
            Clique em Salvar
          </p>

          <p className="text-sm text-zinc-500">
            Sua conta ficará cadastrada.
          </p>

        </div>

      </div>

    </div>

  </div>

  <div className="p-6">

    <Link
      href="/admin/dados-bancarios"
      className="
      h-11
      rounded-xl
      bg-[#8B1538]
      hover:bg-[#73122F]
      transition
      text-white
      font-bold
      flex
      items-center
      justify-center
      text-base
      w-full
      "
    >
      Ir para Dados Bancários
    </Link>

  </div>

</div>

{/* ================= CARD 9 ================= */}

<div
  className="
  bg-white
  rounded-[30px]
  border
  border-zinc-200
  shadow-sm
  hover:shadow-xl
  transition-all
  duration-300
  overflow-hidden
"
>

  <div className="p-6 pb-0">

    <div className="w-20 h-20 rounded-3xl bg-[#FCEBED] flex items-center justify-center mb-4">

      <Link2
        size={42}
        className="text-[#8B1538]"
      />

    </div>

    <div className="flex items-center justify-between">

      <h2 className="text-[22px] font-black text-[#22181C]">
        Link do Cardápio
      </h2>

      <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-bold text-xs">
        Pendente
      </span>

    </div>

    <p className="mt-2 text-[17px] leading-6 text-zinc-600">

      Compartilhe seu cardápio utilizando
      o link exclusivo e o QR Code.

    </p>

  </div>

  <div className="mx-6 mt-5 rounded-xl bg-[#EEF8FF] border border-[#CDEBFF] p-4">

    <p className="font-bold text-sky-700 mb-2">
      🚀 Dica
    </p>

    <p className="text-sm leading-6 text-sky-800">

      Compartilhe o link no Instagram,
      WhatsApp, Facebook e Google.

    </p>

  </div>

  <div className="px-6 mt-5">

    <h3 className="text-base font-bold mb-4">
      Passo a passo
    </h3>

    <div className="space-y-4">

      <div className="flex gap-3">

        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          1
        </div>

        <div>

          <p className="font-medium text-[15px]">
            Abra Link do Cardápio
          </p>

          <p className="text-sm text-zinc-500">
            Clique no menu lateral.
          </p>

        </div>

      </div>

      <div className="flex gap-3">

        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          2
        </div>

        <div>

          <p className="font-medium text-[15px]">
            Copie o link
          </p>

          <p className="text-sm text-zinc-500">
            Ou faça o download do QR Code.
          </p>

        </div>

      </div>

      <div className="flex gap-3">

        <div className="w-7 h-7 rounded-full bg-[#8B1538] text-white font-bold flex items-center justify-center">
          3
        </div>

        <div>

          <p className="font-medium text-[15px]">
            Compartilhe
          </p>

          <p className="text-sm text-zinc-500">
            Agora seus clientes já podem pedir.
          </p>

        </div>

      </div>

    </div>

  </div>

  <div className="p-6">

    <Link
      href="/admin/link-cardapio"
      className="
      h-11
      rounded-xl
      bg-[#8B1538]
      hover:bg-[#73122F]
      transition
      text-white
      font-bold
      flex
      items-center
      justify-center
      text-base
      w-full
    "
    >
      Ir para Link do Cardápio
    </Link>

  </div>

</div>

</div>

{/* ================= RODAPÉ ================= */}

<div
  className="
  mt-5
  rounded-[24px]
  border
  border-amber-200
  bg-amber-50
  p-6
  flex
  items-start
  gap-3
"
>

  <div className="text-2xl">
    💡
  </div>

  <div>

    <h3 className="font-bold text-[#8B1538] text-base">
      Importante
    </h3>

    <p className="text-zinc-700 leading-6 mt-2">

      Siga os passos exatamente na ordem indicada.
      Primeiro crie as categorias, depois os produtos,
      personalize o cardápio, configure horários,
      endereço, taxa de entrega, pagamentos,
      dados bancários e por último compartilhe
      o link do cardápio.

    </p>

  </div>

</div>

</div>

</main>
);
}