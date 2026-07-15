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
    <main className="min-h-screen bg-[#F7F5F4] p-2.5">

      <div className="max-w-[1450px] mx-auto">

        {/* HEADER */}

        <div className="bg-white rounded-[28px] shadow-sm border border-zinc-200 p-2.5">

          <div className="flex items-center">

            <div>

              <div className="flex items-center gap-2.5">

                <div
                  className="
                  w-10
                  h-10
                  rounded-lg
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
                    text-xl
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
                    leading-5
                    text-xs text-zinc-500
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
          mt-2
          grid
          grid-cols-1
          xl:grid-cols-3
          gap-2.5
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
  flex
  flex-col
"
>

  {/* TOPO */}

  <div className="p-2.5 pb-0">

    <div
      className="
      w-10
      h-10
      rounded-3xl
      bg-[#FCEBED]
      flex
      items-center
      justify-center
      mb-4
    "
    >

      <FolderOpen
        size={16}
        className="text-[#8B1538]"
      />

    </div>

    <div>

  <h2
    className="
      text-[16px]
      font-bold
      text-[#22181C]
    "
  >
    Criar Categorias
  </h2>

</div>

    <p
      className="
      mt-2
      text-xs
      leading-5
      text-zinc-500
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
mx-4
mt-2
rounded-lg
bg-[#EEF8FF]
border
border-[#CDEBFF]
px-3
py-2
"
  >

    <p
      className="
      font-semibold text-xs
      text-[#A16207]
      mb-0.5
    "
    >
      ⚠ Importante
    </p>

    <p
      className="
      text-xs
      leading-5
      text-[#854D0E]
    "
    >
      Se nenhuma categoria for criada,
      será impossível cadastrar produtos.
    </p>

  </div>

  {/* PASSOS */}

  <div className="px-6 mt-2 flex-1">

    <h3
      className="
      text-base
      font-semibold text-xs
      mb-4
    "
    >
      
    </h3>

    <div className="space-y-3">

      <div className="flex gap-2.5">

        <div
          className="
          w-6
          h-6
          rounded-full
          bg-[#8B1538]
          text-white
          font-semibold text-xs
          flex
          items-center
          justify-center
          shrink-0
        "
        >
          1
        </div>

        <div>

          <p className="font-semibold text-sm">
            Vá até o menu Categorias
          </p>

          <p className="text-xs text-zinc-500">
            Clique em Categorias no menu lateral.
          </p>

        </div>

      </div>

      <div className="flex gap-2.5">

        <div
          className="
          w-6
          h-6
          rounded-full
          bg-[#8B1538]
          text-white
          font-semibold text-xs
          flex
          items-center
          justify-center
          shrink-0
        "
        >
          2
        </div>

        <div>

          <p className="font-semibold text-sm">
            Clique em Nova Categoria
          </p>

          <p className="text-xs text-zinc-500">
            Será aberta a tela para cadastro.
          </p>

        </div>

      </div>

      <div className="flex gap-2.5">

        <div
          className="
          w-6
          h-6
          rounded-full
          bg-[#8B1538]
          text-white
          font-semibold text-xs
          flex
          items-center
          justify-center
          shrink-0
          "
        >
          3
        </div>

        <div>

          <p className="font-semibold text-sm">
            Digite o nome da categoria
          </p>

          <p className="text-xs text-zinc-500">
            Ex.: Hambúrgueres, Bebidas,
            Pizzas ou Sobremesas.
          </p>

        </div>

      </div>

      <div className="flex gap-2.5">

        <div
          className="
          w-6
          h-6
          rounded-full
          bg-[#8B1538]
          text-white
          font-semibold text-xs
          flex
          items-center
          justify-center
          shrink-0
        "
        >
          4
        </div>

        <div>

          <p className="font-semibold text-sm">
            Clique em Salvar Categoria
          </p>

          <p className="text-xs text-zinc-500">
            Após salvar, você já poderá
            cadastrar produtos normalmente.
          </p>

        </div>

      </div>

    </div>

  </div>

  {/* BOTÃO */}

<div className="px-6 py-4 mt-auto flex justify-end">

  <Link
    href="/admin/categorias"
    className="
      flex
      items-center
      gap-2
      text-xs
      font-semibold
      text-[#8B1538]
      hover:text-[#6D102D]
      transition-colors
    "
  >
    Ir para Categorias

    <span className="text-base">→</span>

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
  flex
  flex-col
"
>

  <div className="p-2.5 pb-0">

    <div
      className="
      w-10
      h-10
      rounded-3xl
      bg-[#FCEBED]
      flex
      items-center
      justify-center
      mb-4
    "
    >

      <Hamburger
        size={16}
        className="text-[#8B1538]"
      />

    </div>

<div>

  <h2
    className="
      text-[16px]
      font-bold
      text-[#22181C]
    "
  >
    Criar Produtos
  </h2>

</div>

    <p className="mt-2 text-xs leading-5 text-zinc-500">

      Agora que já existe uma categoria,
      você pode cadastrar os produtos
      que aparecerão para seus clientes.

    </p>

  </div>

  <div
className="
mx-4
mt-2
rounded-lg
bg-[#EEF8FF]
border
border-[#CDEBFF]
px-3
py-2
"
  >

    <p className="font-semibold text-xs text-sky-700 mb-0.5">
      💡 Dica
    </p>

    <p className="text-xs leading-5 text-sky-800">

      Utilize boas fotos e uma descrição
      completa para aumentar suas vendas.

    </p>

  </div>

  <div className="px-6 mt-2 flex-1">



    <div className="space-y-3">

      <div className="flex gap-2.5">

        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          1
        </div>

        <div>

          <p className="font-semibold text-sm">
            Vá até Produtos
          </p>

          <p className="text-xs text-zinc-500">
            Clique em Produtos no menu lateral.
          </p>

        </div>

      </div>

      <div className="flex gap-2.5">

        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          2
        </div>

        <div>

          <p className="font-semibold text-sm">
            Clique em Novo Produto
          </p>

          <p className="text-xs text-zinc-500">
            Abrirá a tela de cadastro.
          </p>

        </div>

      </div>

      <div className="flex gap-2.5">

        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          3
        </div>

        <div>

          <p className="font-semibold text-sm">
            Preencha todas as informações
          </p>

          <p className="text-xs text-zinc-500">
            Nome, preço, categoria,
            descrição e imagem.
          </p>

        </div>

      </div>

      <div className="flex gap-2.5">

        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          4
        </div>

        <div>

          <p className="font-semibold text-sm">
            Clique em Salvar Produto
          </p>

          <p className="text-xs text-zinc-500">
            Seu produto ficará disponível
            no cardápio.
          </p>

        </div>

      </div>

    </div>

  </div>

<div className="px-6 py-4 mt-auto flex justify-end">

  <Link
    href="/admin/categorias"
    className="
      flex
      items-center
      gap-2
      text-xs
      font-semibold
      text-[#8B1538]
      hover:text-[#6D102D]
      transition-colors
    "
  >
    Ir para Produtos

    <span className="text-base">→</span>

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
  flex
  flex-col
"
>

  <div className="p-2.5 pb-0">

    <div
      className="
      w-10
      h-10
      rounded-3xl
      bg-[#FCEBED]
      flex
      items-center
      justify-center
      mb-4
    "
    >

      <Palette
        size={16}
        className="text-[#8B1538]"
      />

    </div>

<div>

  <h2
    className="
      text-[16px]
      font-bold
      text-[#22181C]
    "
  >
    Personalizar Cardápio
  </h2>

</div>

    <p className="mt-2 text-xs leading-5 text-zinc-500">

      Agora personalize seu cardápio com a
      identidade visual do seu restaurante.

    </p>

  </div>

  <div
className="
mx-4
mt-2
rounded-lg
bg-[#EEF8FF]
border
border-[#CDEBFF]
px-3
py-2
"
  >

    <p className="font-semibold text-xs text-[#A16207] mb-0.5">
      🎨 Personalização
    </p>

    <p className="text-xs leading-5 text-[#854D0E]">

      Essas informações aparecerão para
      todos os seus clientes.

    </p>

  </div>

  <div className="px-6 mt-2 flex-1">



    <div className="space-y-3">

      <div className="flex gap-2.5">

        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          1
        </div>

        <div>

          <p className="font-semibold text-sm">
            Vá em Aparência
          </p>

          <p className="text-xs text-zinc-500">
            Clique em Aparência no menu.
          </p>

        </div>

      </div>

      <div className="flex gap-2.5">

        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          2
        </div>

        <div>

          <p className="font-semibold text-sm">
            Preencha os dados
          </p>

          <p className="text-xs text-zinc-500">
            Categoria, pedido mínimo,
            nome e atendimento.
          </p>

        </div>

      </div>

      <div className="flex gap-2.5">

        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          3
        </div>

        <div>

          <p className="font-semibold text-sm">
            Escolha a cor principal
          </p>

          <p className="text-xs text-zinc-500">
            Você pode usar vinho,
            preto ou qualquer outra cor.
          </p>

        </div>

      </div>

      <div className="flex gap-2.5">

        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          4
        </div>

        <div>

          <p className="font-semibold text-sm">
            Envie sua logo e banner
          </p>

          <p className="text-xs text-zinc-500">
            Utilize imagens em alta qualidade.
          </p>

        </div>

      </div>

      <div className="flex gap-2.5">

        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          5
        </div>

        <div>

          <p className="font-semibold text-sm">
            Clique em Salvar Alterações
          </p>

          <p className="text-xs text-zinc-500">
            O visual será atualizado
            imediatamente.
          </p>

        </div>

      </div>

    </div>

  </div>

<div className="px-6 py-4 mt-auto flex justify-end">

  <Link
    href="/admin/categorias"
    className="
      flex
      items-center
      gap-2
      text-xs
      font-semibold
      text-[#8B1538]
      hover:text-[#6D102D]
      transition-colors
    "
  >
    Ir para Aparência

    <span className="text-base">→</span>

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
  gap-2.5
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
  flex
  flex-col
"
>

  <div className="p-2.5 pb-0">

    <div
      className="
      w-10
      h-10
      rounded-3xl
      bg-[#FCEBED]
      flex
      items-center
      justify-center
      mb-4
    "
    >

      <Clock3
        size={16}
        className="text-[#8B1538]"
      />

    </div>

<div>

  <h2
    className="
      text-[16px]
      font-bold
      text-[#22181C]
    "
  >
    Horários
  </h2>

</div>

    <p
      className="
      mt-2
      text-xs
      leading-5
      text-zinc-500
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
mx-4
mt-2
rounded-lg
bg-[#EEF8FF]
border
border-[#CDEBFF]
px-3
py-2
"
  >

    <p className="font-semibold text-xs text-sky-700 mb-0.5">
      💡 Dica
    </p>

    <p
      className="
      text-xs
      leading-5
      text-sky-800
    "
    >
      Marque como fechado os dias que
      seu restaurante não funciona.
    </p>

  </div>

  <div className="px-6 mt-2 flex-1">

    <h3
      className="
      text-base
      font-semibold text-xs
      mb-4
    "
    >
     
    </h3>

    <div className="space-y-3">

      <div className="flex gap-2.5">

        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          1
        </div>

        <div>

          <p className="font-semibold text-sm">
            Vá até Horários
          </p>

          <p className="text-xs text-zinc-500">
            Clique em Horários no menu lateral.
          </p>

        </div>

      </div>

      <div className="flex gap-2.5">

        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          2
        </div>

        <div>

          <p className="font-semibold text-sm">
            Informe abertura
          </p>

          <p className="text-xs text-zinc-500">
            Defina o horário que sua loja abre.
          </p>

        </div>

      </div>

      <div className="flex gap-2.5">

        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          3
        </div>

        <div>

          <p className="font-semibold text-sm">
            Informe fechamento
          </p>

          <p className="text-xs text-zinc-500">
            Defina o horário de encerramento.
          </p>

        </div>

      </div>

      <div className="flex gap-2.5">

        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          4
        </div>

        <div>

          <p className="font-semibold text-sm">
            Marque dias fechados
          </p>

          <p className="text-xs text-zinc-500">
            Caso exista algum dia sem atendimento.
          </p>

        </div>

      </div>

      <div className="flex gap-2.5">

        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          5
        </div>

        <div>

          <p className="font-semibold text-sm">
            Clique em Salvar
          </p>

          <p className="text-xs text-zinc-500">
            Os horários aparecerão para seus clientes.
          </p>

        </div>

      </div>

    </div>

  </div>

<div className="px-6 py-4 mt-auto flex justify-end">

  <Link
    href="/admin/categorias"
    className="
      flex
      items-center
      gap-2
      text-xs
      font-semibold
      text-[#8B1538]
      hover:text-[#6D102D]
      transition-colors
    "
  >
    Ir para Horários

    <span className="text-base">→</span>

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
  flex
  flex-col
"
>

  <div className="p-2.5 pb-0">

    <div className="w-10 h-10 rounded-3xl bg-[#FCEBED] flex items-center justify-center mb-4">

      <MapPin
        size={16}
        className="text-[#8B1538]"
      />

    </div>

<div>

  <h2
    className="
      text-[16px]
      font-bold
      text-[#22181C]
    "
  >
    Endereço do Restaurante
  </h2>

</div>

    <p className="mt-2 text-xs leading-5 text-zinc-500">

      Cadastre corretamente o endereço
      da sua loja. Essas informações serão
      utilizadas para calcular a taxa de entrega.

    </p>

  </div>

  <div 
  className="
mx-4
mt-2
rounded-lg
bg-[#EEF8FF]
border
border-[#CDEBFF]
px-3
py-2
"
>

    <p className="font-semibold text-xs text-sky-700 mb-0.5">
      📍 Importante
    </p>

    <p className="text-xs leading-5 text-sky-800">

      Informe o CEP corretamente para que
      o cálculo da distância funcione.

    </p>

  </div>

  <div className="px-6 mt-2 flex-1">



    <div className="space-y-3">

      <div className="flex gap-2.5">
        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          1
        </div>

        <div>
          <p className="font-semibold text-sm">Abra Endereço do Restaurante</p>
          <p className="text-xs text-zinc-500">
            Clique no menu lateral.
          </p>
        </div>
      </div>

      <div className="flex gap-2.5">
        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          2
        </div>

        <div>
          <p className="font-semibold text-sm">Digite o CEP</p>
          <p className="text-xs text-zinc-500">
            O restante será preenchido automaticamente.
          </p>
        </div>
      </div>

      <div className="flex gap-2.5">
        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          3
        </div>

        <div>
          <p className="font-semibold text-sm">Complete os dados</p>
          <p className="text-xs text-zinc-500">
            Número, complemento e referência.
          </p>
        </div>
      </div>

      <div className="flex gap-2.5">
        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          4
        </div>

        <div>
          <p className="font-semibold text-sm">Clique em Salvar</p>
          <p className="text-xs text-zinc-500">
            Seu endereço ficará configurado.
          </p>
        </div>
      </div>

    </div>

  </div>

 <div className="px-6 py-4 mt-auto flex justify-end">

  <Link
    href="/admin/categorias"
    className="
      flex
      items-center
      gap-2
      text-xs
      font-semibold
      text-[#8B1538]
      hover:text-[#6D102D]
      transition-colors
    "
  >
    Ir para Endereço

    <span className="text-base">→</span>

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
  flex
  flex-col
"
>

  <div className="p-2.5 pb-0">

    <div className="w-10 h-10 rounded-3xl bg-[#FCEBED] flex items-center justify-center mb-4">

      <Bike
        size={16}
        className="text-[#8B1538]"
      />

    </div>

<div>

  <h2
    className="
      text-[16px]
      font-bold
      text-[#22181C]
    "
  >
Taxa de Entrega   

</h2>

</div>

    <p className="mt-2 text-xs leading-5 text-zinc-500">

      Escolha como deseja cobrar o frete
      dos seus clientes.

    </p>

  </div>

  <div 
  className="
mx-4
mt-2
rounded-lg
bg-[#EEF8FF]
border
border-[#CDEBFF]
px-3
py-2
"
>

    <p className="font-semibold text-xs text-[#A16207] mb-0.5">
      🚚 Opções
    </p>

    <ul className="space-y-3 text-xs leading-5 text-[#854D0E]">

      <li>• Frete grátis</li>

      <li>• Taxa fixa</li>

      <li>• Por distância (faixas de KM)</li>

    </ul>

  </div>

  <div className="px-6 mt-2 flex-1">



    <div className="space-y-3">

      <div className="flex gap-2.5">

        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          1
        </div>

        <div>
          <p className="font-semibold text-sm">Abra Taxa de Entrega</p>
          <p className="text-xs text-zinc-500">
            Acesse pelo menu lateral.
          </p>
        </div>

      </div>

      <div className="flex gap-2.5">

        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          2
        </div>

        <div>
          <p className="font-semibold text-sm">Escolha a forma de cobrança</p>
          <p className="text-xs text-zinc-500">
            Frete grátis, taxa fixa ou distância.
          </p>
        </div>

      </div>

      <div className="flex gap-2.5">

        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          3
        </div>

        <div>
          <p className="font-semibold text-sm">Configure os valores</p>
          <p className="text-xs text-zinc-500">
            Adicione quantas faixas desejar.
          </p>
        </div>

      </div>

      <div className="flex gap-2.5">

        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          4
        </div>

        <div>
          <p className="font-semibold text-sm">Clique em Salvar</p>
          <p className="text-xs text-zinc-500">
            Sua entrega estará pronta para uso.
          </p>
        </div>

      </div>

    </div>

  </div>

 <div className="px-6 py-4 mt-auto flex justify-end">

  <Link
    href="/admin/categorias"
    className="
      flex
      items-center
      gap-2
      text-xs
      font-semibold
      text-[#8B1538]
      hover:text-[#6D102D]
      transition-colors
    "
  >
    Ir para Taxa de Entrega

    <span className="text-base">→</span>

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
  gap-2.5
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
  flex
  flex-col
"
>

  <div className="p-2.5 pb-0">

    <div className="w-10 h-10 rounded-3xl bg-[#FCEBED] flex items-center justify-center mb-4">

      <CreditCard
        size={16}
        className="text-[#8B1538]"
      />

    </div>

<div>

  <h2
    className="
      text-[16px]
      font-bold
      text-[#22181C]
    "
  >
    Pagamentos
  </h2>

</div>

    <p className="mt-2 text-xs leading-5 text-zinc-500">

      Escolha quais formas de pagamento
      deseja aceitar em seu restaurante.

    </p>

  </div>

  <div 
  className="
mx-4
mt-2
rounded-lg
bg-[#EEF8FF]
border
border-[#CDEBFF]
px-3
py-2
"
>

    <p className="font-semibold text-xs text-sky-700 mb-0.5">
      💰 Importante
    </p>

    <p className="text-xs leading-5 text-sky-800">

      Você pode ativar dinheiro,
      Pix e cartão conforme desejar.

    </p>

  </div>

  <div className="px-6 mt-2 flex-1">



    <div className="space-y-3">

      <div className="flex gap-2.5">

        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          1
        </div>

        <div>

          <p className="font-semibold text-sm">
            Abra Pagamentos
          </p>

          <p className="text-xs text-zinc-500">
            Clique em Pagamentos.
          </p>

        </div>

      </div>

      <div className="flex gap-2.5">

        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          2
        </div>

        <div>

          <p className="font-semibold text-sm">
            Escolha os meios de pagamento
          </p>

          <p className="text-xs text-zinc-500">
            Ative apenas os que desejar.
          </p>

        </div>

      </div>

      <div className="flex gap-2.5">

        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          3
        </div>

        <div>

          <p className="font-semibold text-sm">
            Clique em Salvar
          </p>

          <p className="text-xs text-zinc-500">
            As alterações serão aplicadas.
          </p>

        </div>

      </div>

    </div>

  </div>

<div className="px-6 py-4 mt-auto flex justify-end">

  <Link
    href="/admin/categorias"
    className="
      flex
      items-center
      gap-2
      text-xs
      font-semibold
      text-[#8B1538]
      hover:text-[#6D102D]
      transition-colors
    "
  >
    Ir para Pagamentos

    <span className="text-base">→</span>

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
  flex
  flex-col
"
>

  <div className="p-2.5 pb-0">

    <div className="w-10 h-10 rounded-3xl bg-[#FCEBED] flex items-center justify-center mb-4">

      <Landmark
        size={16}
        className="text-[#8B1538]"
      />

    </div>

 <div>

  <h2
    className="
      text-[16px]
      font-bold
      text-[#22181C]
    "
  >
    Dados Bancários
  </h2>

</div>

    <p className="mt-2 text-xs leading-5 text-zinc-500">

      Informe a conta que irá receber
      os pagamentos realizados no Pix.

    </p>

  </div>

  <div 
  className="
mx-4
mt-2
rounded-lg
bg-[#EEF8FF]
border
border-[#CDEBFF]
px-3
py-2
"
>

    <p className="font-semibold text-xs text-[#A16207] mb-0.5">
      🏦 Atenção
    </p>

    <p className="text-xs leading-5 text-[#854D0E]">

      Utilize uma conta de sua titularidade
      para evitar problemas no recebimento.

    </p>

  </div>

  <div className="px-6 mt-2 flex-1">



    <div className="space-y-3">

      <div className="flex gap-2.5">

        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          1
        </div>

        <div>

          <p className="font-semibold text-sm">
            Abra Dados Bancários
          </p>

          <p className="text-xs text-zinc-500">
            Clique no menu lateral.
          </p>

        </div>

      </div>

      <div className="flex gap-2.5">

        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          2
        </div>

        <div>

          <p className="font-semibold text-sm">
            Informe Banco, Agência e Conta
          </p>

          <p className="text-xs text-zinc-500">
            Digite todas as informações.
          </p>

        </div>

      </div>

      <div className="flex gap-2.5">

        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          3
        </div>

        <div>

          <p className="font-semibold text-sm">
            Clique em Salvar
          </p>

          <p className="text-xs text-zinc-500">
            Sua conta ficará cadastrada.
          </p>

        </div>

      </div>

    </div>

  </div>

<div className="px-6 py-4 mt-auto flex justify-end">

  <Link
    href="/admin/categorias"
    className="
      flex
      items-center
      gap-2
      text-xs
      font-semibold
      text-[#8B1538]
      hover:text-[#6D102D]
      transition-colors
    "
  >
    Ir para Dados Bancários

    <span className="text-base">→</span>

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
  flex
  flex-col
"
>

  <div className="p-2.5 pb-0">

    <div className="w-10 h-10 rounded-3xl bg-[#FCEBED] flex items-center justify-center mb-4">

      <Link2
        size={16}
        className="text-[#8B1538]"
      />

    </div>

<div>

  <h2
    className="
      text-[16px]
      font-bold
      text-[#22181C]
    "
  >
    Link do Cardápio
  </h2>

</div>

    <p className="mt-2 text-xs leading-5 text-zinc-500">

      Compartilhe seu cardápio utilizando
      o link exclusivo e o QR Code.

    </p>

  </div>

  <div 
  className="
mx-4
mt-2
rounded-lg
bg-[#EEF8FF]
border
border-[#CDEBFF]
px-3
py-2
"
>

    <p className="font-semibold text-xs text-sky-700 mb-0.5">
      🚀 Dica
    </p>

    <p className="text-xs leading-5 text-sky-800">

      Compartilhe o link no Instagram,
      WhatsApp, Facebook e Google.

    </p>

  </div>

  <div className="px-6 mt-2 flex-1">



    <div className="space-y-3">

      <div className="flex gap-2.5">

        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          1
        </div>

        <div>

          <p className="font-semibold text-sm">
            Abra Link do Cardápio
          </p>

          <p className="text-xs text-zinc-500">
            Clique no menu lateral.
          </p>

        </div>

      </div>

      <div className="flex gap-2.5">

        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          2
        </div>

        <div>

          <p className="font-semibold text-sm">
            Copie o link
          </p>

          <p className="text-xs text-zinc-500">
            Ou faça o download do QR Code.
          </p>

        </div>

      </div>

      <div className="flex gap-2.5">

        <div className="w-6 h-6 rounded-full bg-[#8B1538] text-white font-semibold text-xs flex items-center justify-center">
          3
        </div>

        <div>

          <p className="font-semibold text-sm">
            Compartilhe
          </p>

          <p className="text-xs text-zinc-500">
            Agora seus clientes já podem pedir.
          </p>

        </div>

      </div>

    </div>

  </div>

<div className="px-6 py-4 mt-auto flex justify-end">

  <Link
    href="/admin/categorias"
    className="
      flex
      items-center
      gap-2
      text-xs
      font-semibold
      text-[#8B1538]
      hover:text-[#6D102D]
      transition-colors
    "
  >
    Ir para Link do Cardápio

    <span className="text-base">→</span>

  </Link>

</div>

</div>

</div>


{/* ================= DICA IA ================= */}

<div
  className="
    mt-6
    rounded-[24px]
    border
    border-sky-200
    bg-[#FAFDFF]
    p-6
  "
>

  <div className="flex items-start gap-4">

    <div className="text-3xl">
      ✨
    </div>

    <div>

      <h2 className="text-xl font-bold text-[#22181C]">
        Venda muito mais com imagens profissionais
      </h2>

      <p className="mt-2 text-sm text-zinc-700 leading-7">

        Produtos com imagens bonitas despertam muito mais desejo de compra.

Você pode utilizar o ChatGPT ou o Google Gemini para criar imagens profissionais para o seu cardápio.

Basta tirar uma foto do produto ou apenas descrevê-lo.

Sempre peça a imagem em 1200 x 1200 pixels (quadrado), pois esse é o tamanho ideal para o MeuCardápio.

      </p>

      <p className="mt-3 text-sm text-zinc-700 leading-7">

        Basta tirar uma foto do seu produto pronto ou simplesmente
        descrever como ele deve ser.

        A Inteligência Artificial consegue gerar imagens em poucos
        segundos.

      </p>

      <p className="mt-3 text-sm text-zinc-700 leading-7">

        Sempre peça imagens no tamanho

        <span className="font-bold">
          {" "}1200 x 1200 pixels{" "}
        </span>

        (quadrado), pois é o formato ideal para o MeuCardápio.

      </p>

    </div>

  </div>

  <div className="mt-8">

    <h3 className="text-lg font-bold text-[#22181C]">

      Exemplos de prompts

    </h3>

    <p className="text-sm text-zinc-500 mt-1">

      Copie qualquer um destes exemplos e personalize para o seu produto.

    </p>

  </div>

  <div className="grid xl:grid-cols-2 gap-4 mt-5">

    {/* PROMPT 1 */}

    <div className="rounded-xl border bg-white p-4">

      <p className="font-semibold text-[#8B1538] mb-3">

        🥤 Açaí

      </p>

      <pre className="text-xs leading-6 text-zinc-700 whitespace-pre-wrap font-sans">

{`Quero que você crie para mim a imagem de um copo de açaí de 500ml com adicionais de morango, banana e pistache.

Quero que seja uma fotografia extremamente realista, em alta qualidade, no tamanho 1200 x 1200 pixels.

Essa imagem será utilizada no meu cardápio digital.

Quero um produto extremamente atrativo, com iluminação profissional, fundo de madeira e aparência premium para aumentar minhas vendas.`}

      </pre>

    </div>

    {/* PROMPT 2 */}

    <div className="rounded-xl border bg-white p-4">

      <p className="font-semibold text-[#8B1538] mb-3">

        🍕

        Pizza

      </p>

      <pre className="text-xs leading-6 text-zinc-700 whitespace-pre-wrap font-sans">

{`Crie uma pizza grande de calabresa com borda recheada de catupiry.

Quero uma fotografia extremamente realista no tamanho 1200x1200 pixels.

A pizza deve estar sobre uma mesa de cimento queimado, com plantas verdes desfocadas ao fundo, iluminação profissional e aparência extremamente apetitosa para utilização em um cardápio digital.`}

      </pre>

    </div>

    {/* PROMPT 3 */}

    <div className="rounded-xl border bg-white p-4">

      <p className="font-semibold text-[#8B1538] mb-3">

        🍔

        Hambúrguer

      </p>

      <pre className="text-xs leading-6 text-zinc-700 whitespace-pre-wrap font-sans">

{`Crie um hambúrguer artesanal com pão brioche, carne 180g, cheddar, bacon crocante, cebola caramelizada e molho especial.

Quero uma fotografia extremamente realista em 1200x1200 pixels.

Utilize fundo de plantas desfocadas, iluminação quente, aparência premium e estilo food photography para meu cardápio digital.`}

      </pre>

    </div>

    {/* PROMPT 4 */}

    <div className="rounded-xl border bg-white p-4">

      <p className="font-semibold text-[#8B1538] mb-3">

        🍝

        Marmita

      </p>

      <pre className="text-xs leading-6 text-zinc-700 whitespace-pre-wrap font-sans">

{`Crie uma fotografia extremamente realista de uma marmita de parmegiana com arroz branco, batata frita e salada.

A imagem deve possuir resolução 1200x1200 pixels.

Utilize fundo de madeira rústica, iluminação natural e aparência extremamente saborosa para utilização em um cardápio digital.`}

      </pre>

    </div>

  </div>

</div>





<div
  className="
  mt-8
  rounded-[24px]
  border
  border-amber-200
  bg-amber-50
  p-2.5
  flex
  items-start
  gap-2.5
"
>

  <div className="text-2xl">
    
  </div>

  <div>

    <h3 className="font-semibold text-xs text-[#8B1538] text-base">
      
    </h3>

    <p className="text-zinc-700 leading-7 mt-2">


Nenhuma imagem precisa ficar perfeita na primeira tentativa.

Se desejar alterar qualquer detalhe, basta responder para a IA dizendo exatamente o que deseja modificar.

Exemplos:

• trocar o fundo

• deixar mais iluminada

• mudar os ingredientes

• aproximar a câmera

• colocar fumaça

• deixar mais apetitosa

Quanto mais detalhes você fornecer, melhor será o resultado final.

    </p>

  </div>

</div>


{/* ================= RODAPÉ ================= */}

<div
  className="
  mt-8
  rounded-[24px]
  border
  border-amber-200
  bg-amber-50
  p-2.5
  flex
  items-start
  gap-2.5
"
>

  <div className="text-2xl">
    💡
  </div>

  <div>

    <h3 className="font-semibold text-xs text-[#8B1538] text-base">
      Importante
    </h3>

    <p className="text-zinc-700 leading-5 mt-2">

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
