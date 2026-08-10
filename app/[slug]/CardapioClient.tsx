"use client"

export const dynamic = "force-dynamic"


import SplashScreen from "../components/SplashScreen";
import {
  useEffect,
  useState,
  useRef,
} from "react"

import {
  Bike,
  Clock3,
  Wallet,
  Star,
  Gift,
  Ticket,
} from "lucide-react";

import { useParams } from "next/navigation"
import { useRestaurant } from "@/contexts/RestaurantContext";

import Header from "../components/Header"
import Benefits from "../components/Benefits"
import ProductCard from "../components/ProductCard"
import FeaturedProductCard from "../components/FeaturedProductCard";
import ProductModal from "../components/ProductModal"
import Cart from "../components/Cart"
import CheckoutModal from "../components/CheckoutModal"
import BottomNavigation from "../components/BottomNavigation";
import RestaurantFooter from "../components/RestaurantFooter";

import { supabase } from "@/lib/supabase"

import type {
  Adicional,
  ProdutoFormatado,
  CartItem
} from "../types"

type CardapioClientProps = {
  modoEditor?: boolean;
};

export default function CardapioClient({
  modoEditor = false,
}: CardapioClientProps) {

const params = useParams()

const slug = params.slug as string

const {
  logo,
  corPrincipal,
} = useRestaurant();

console.log("SLUG ATUAL:", slug)

useEffect(() => {
  localStorage.setItem(
    "cardapio-slug",
    slug
  )
}, [slug])



useEffect(() => {
  async function carregarCliente() {
    const token =
  localStorage.getItem(`cliente_token-${slug}`) ||
  localStorage.getItem("cliente_token");

    if (!token) {
      setCarregandoCliente(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/cliente/me?token=${token}`
      );

      const resultado = await response.json();

      if (resultado.success) {
        setCliente(resultado.cliente);

        console.log(
          "CLIENTE LOGADO:",
          resultado.cliente
        );
      }
    } catch (e) {
      console.error(e);
    }

    setCarregandoCliente(false);
  }

  carregarCliente();
}, []);



  const [produtos, setProdutos] =
    useState<ProdutoFormatado[]>([])

    const [produtosCarregados, setProdutosCarregados] =
  useState(false);

const [loadingInicial, setLoadingInicial] =
  useState(true);

  const [selectedProduct, setSelectedProduct] =
    useState<ProdutoFormatado | null>(null)

  const [openModal, setOpenModal] =
    useState(false)

    const [modalLojaFechada, setModalLojaFechada] =
  useState(false)

  const [
    openCheckout,
    setOpenCheckout,
  ] = useState(false)

  const [cart, setCart] =
    useState<CartItem[]>([])

    const [carregandoCarrinho, setCarregandoCarrinho] =
  useState(false)

  const [
  categoriaSelecionada,
  setCategoriaSelecionada,
] = useState<string | null>(null)



  const [categorias, setCategorias] =
    useState<string[]>([])

const categoriasRef =
  useRef<HTMLDivElement>(null)

  const categoriaRefs =
  useRef<{ [key: string]: HTMLDivElement | null }>({})

  const botoesCategoriaRef =
  useRef<{ [key: string]: HTMLButtonElement | null }>({})

  const [mostrarEsquerda, setMostrarEsquerda] =
  useState(false)

const [mostrarDireita, setMostrarDireita] =
  useState(true)

 const [busca, setBusca] =
  useState("")

const [restaurante, setRestaurante] =
  useState<any>(null)

const [aparencia, setAparencia] =
  useState<any>(null)

  const [cliente, setCliente] =
  useState<any>(null);

const [carregandoCliente, setCarregandoCliente] =
  useState(true);

  const [fidelidade, setFidelidade] =
  useState<any>(null);

/* APARÊNCIA */


  useEffect(() => {
  document.documentElement.style.setProperty(
    "--primary-color",
    corPrincipal
  )
}, [corPrincipal])

const corTextoBotao = "#FFFFFF"


const [banner, setBanner] =
  useState<string>("")

const [lightMode, setLightMode] =
  useState(true)

  useEffect(() => {

  const el = categoriasRef.current

  if (!el) return

  const atualizarSetas = () => {

    setMostrarEsquerda(
      el.scrollLeft > 10
    )

    setMostrarDireita(
      el.scrollLeft <
      el.scrollWidth -
      el.clientWidth -
      10
    )
  }

  atualizarSetas()

  el.addEventListener(
    "scroll",
    atualizarSetas
  )

  return () =>
    el.removeEventListener(
      "scroll",
      atualizarSetas
    )

}, [categorias])

useEffect(() => {
  let ticking = false;

  const handleScroll = () => {
    if (ticking) return;

    window.requestAnimationFrame(() => {
      let categoriaAtual = "";

      categorias.forEach((categoria) => {
        const elemento = categoriaRefs.current[categoria];

        if (!elemento) return;

        const rect = elemento.getBoundingClientRect();

        if (rect.top <= 150 && rect.bottom >= 150) {
          categoriaAtual = categoria;
        }
      });

      if (
        categoriaAtual &&
        categoriaAtual !== categoriaSelecionada
      ) {
        setCategoriaSelecionada(categoriaAtual);

// botoesCategoriaRef.current[categoriaAtual]?.scrollIntoView({
//   behavior: "smooth",
//   inline: "center",
//   block: "nearest",
// });
      }

      ticking = false;
    });

    ticking = true;
  };

  window.addEventListener("scroll", handleScroll, {
    passive: true,
  });

  return () =>
    window.removeEventListener("scroll", handleScroll);
}, [categorias, categoriaSelecionada]);

  async function buscarProdutos() {

    if (!slug) return

    try {

      /* RESTAURANTE */

      const {
        data: restauranteData,
        error: restauranteError,
      } = await supabase
        .from("restaurantes")
        .select("*")
        .eq("slug", slug)
        .single()


      if (
        restauranteError ||
        !restauranteData
      ) {

        console.log(
          "Erro restaurante:",
          restauranteError
        )

        return
      }

      setRestaurante(
        restauranteData
      )

      const { data: fidelidadeData, error: fidelidadeError } =
  await supabase
    .from("fidelidade")
    .select("*")
    .eq("restaurante_id", restauranteData.id)
    .eq("ativo", true)
    .maybeSingle();

if (fidelidadeError) {
  console.error(
    "ERRO FIDELIDADE:",
    fidelidadeError
  );
}

setFidelidade(fidelidadeData);

const {
  data: categoriasData
} = await supabase
  .from("categorias")
  .select("*")
  .eq(
    "restaurante_id",
    restauranteData.id
  )
  .order("ordem", {
    ascending: true,
  })

      console.log(
  "RESTAURANTE ENCONTRADO:",
  restauranteData
)

      /* APARÊNCIA */

      const {
  data: aparenciaArray,
  error: aparenciaError,
} = await supabase
  .from("aparencia")
  .select("*")
  .eq(
    "restaurante_id",
    restauranteData.id
  )
  .limit(1)

console.log(
  "BUSCANDO ID:",
  restauranteData.id
)

const aparenciaData =
  aparenciaArray?.[0]

  console.log(
  "APARENCIA ARRAY:",
  aparenciaArray
)

console.log(
  "APARENCIA ERROR:",
  aparenciaError
)

console.log(
  "RESTAURANTE ID:",
  restauranteData.id
)

   if (
  aparenciaData &&
  !aparenciaError
) {

  setAparencia(
  aparenciaData
)
console.log(
  "COR DO BANCO:",
  aparenciaData.cor_primaria
)

console.log(
  "LOGO DO BANCO:",
  aparenciaData.logo_url
)

localStorage.setItem(
  "logo-restaurante",
  aparenciaData.logo_url || ""
)

localStorage.setItem(
  "cor-principal",
  aparenciaData.cor_primaria || "#571f5b"
)


console.log(
  "BANNER DO BANCO:",
  aparenciaData.banner_url
)

console.log(
  "PEDIDO APARENCIA DATA:",
  aparenciaData.pedido_minimo
)

console.log(
  "NOME APARENCIA DATA:",
  aparenciaData.nome_restaurante
)

console.log(
  "APARENCIA COMPLETA:",
  JSON.stringify(
    aparenciaData,
    null,
    2
  )
)
console.log(
  "COR PRIMARIA:",
  aparenciaData?.cor_primaria
)

console.log(
  "NOME:",
  aparenciaData.nome_restaurante
)

console.log(
  "PEDIDO:",
  aparenciaData.pedido_minimo
)

console.log("RESTAURANTE:", restaurante);

 
  setBanner(
    aparenciaData.banner_url ||
    ""
  )

  setLightMode(
    aparenciaData.tema !==
    "escuro"
  )

} else {

  setBanner("")

  setLightMode(true)
}
      /* PRODUTOS */

      const {
  data: produtosData,
  error: produtosError,
} = await supabase
  .from("produtos")
  .select("*")
  .eq(
    "restaurante_id",
    restauranteData.id
  )
  .eq(
    "ativo",
    true
  )
  .order("created_at", {
    ascending: false,
  })

      if (
        produtosError ||
        !produtosData
      ) {

        console.log(
          "Erro produtos:",
          produtosError
        )

        setProdutos([])

        return
      }

      const produtosFormatados =
        await Promise.all(

          produtosData.map(
            async (produto) => {

              const {
                data: adicionais,
              } = await supabase
                .from("adicionais")
                .select("*")
                .eq(
                  "produto_id",
                  produto.id
                )

                const {
  data: gruposObrigatorios,
} = await supabase
  .from("grupos_obrigatorios")
  .select(`
    *,
    grupo_obrigatorio_opcoes(*)
  `)
  .eq("produto_id", produto.id);

console.log(
  "SUPABASE PRODUTO:",
  produto
)

       return {

  id: produto.id,

  nome: produto.nome,

  descricao:
    produto.descricao,

  preco: Number(
    produto.preco
  ),

  precoAntigo: Number(produto.preco_antigo || 0),

  imagem:
    produto.imagem,

  categoria:
    produto.categoria ||
    "Outros",

    promocao:
  produto.promocao === true,

adicionais:
  adicionais || [],

gruposObrigatorios:
  gruposObrigatorios || [],
}

            }
          )
        )

    setProdutos(
      produtosFormatados
    )

    setProdutosCarregados(true);

    console.log(
      "PRODUTOS:",
      produtosFormatados
    )

    const categoriasOrdenadas =
      categoriasData?.map(
        (categoria) =>
          categoria.nome
      ) || []

    setCategorias(
      categoriasOrdenadas
    )

    if (
      categoriasOrdenadas.length > 0 &&
      categoriaSelecionada === null
    ) {
      setCategoriaSelecionada(
        categoriasOrdenadas[0]
      )
    }

    // 👇 ADICIONE ESTA LINHA
    setLoadingInicial(false);

  } catch (error) {

      console.log(
        "Erro geral:",
        error
      )

      // 👇 E ESTA TAMBÉM
      setLoadingInicial(false);

    }
}

useEffect(() => {

  buscarProdutos();

  const sessionKey = `sessao-${slug}`;
  const cartKey = `cart-${slug}`;

  const sessaoExiste =
    sessionStorage.getItem(sessionKey);

  if (!sessaoExiste) {

    // Nova sessão
    localStorage.removeItem(cartKey);

    sessionStorage.setItem(
      sessionKey,
      "true"
    );

  }

  const cartStorage =
    localStorage.getItem(cartKey);

  if (cartStorage) {

    setCart(JSON.parse(cartStorage));

  }

}, [slug]);

  useEffect(() => {

    localStorage.setItem(
  `cart-${slug}`,
  JSON.stringify(cart)
)

  }, [cart])

function openProductModal(
  produto: ProdutoFormatado
) {

  if (!lojaAberta) {
    setModalLojaFechada(true)
    return
  }

  setSelectedProduct(produto)
  setOpenModal(true)
}

function addToCart(
  
  produto: ProdutoFormatado,
  observacao?: string,
  adicionaisSelecionados?: Adicional[],
  obrigatoriosSelecionados?: {
  grupo: string;
  nome: string;
  preco: number;
}[]
) {

  if (!lojaAberta) {
  setModalLojaFechada(true)
  return
}

    const totalAdicionais =
      adicionaisSelecionados?.reduce(
        (acc, item) => {

          return (
            acc +
            Number(item.preco)
          )

        },
        0
      ) || 0

      const totalObrigatorios =
  obrigatoriosSelecionados?.reduce(
    (acc, item) => {
      return acc + Number(item.preco)
    },
    0
  ) || 0

const novoItem: CartItem = {

  ...produto,

  uniqueId: crypto.randomUUID(),

  quantity: 1,

  observacao,

  adicionaisSelecionados:
    adicionaisSelecionados || [],

obrigatoriosSelecionados:
  obrigatoriosSelecionados || [],

preco:
  Number(produto.preco) +
  totalAdicionais +
  totalObrigatorios,
}

    setCart((prev) => [
      ...prev,
      novoItem,
    ])

    setOpenModal(false)
  }

  function increaseQuantity(
    uniqueId: string
  ) {

    setCart((prev) =>

      prev.map((item) =>

        item.uniqueId === uniqueId

          ? {
              ...item,
              quantity:
                item.quantity + 1,
            }

          : item
      )
    )
  }

  function decreaseQuantity(
    uniqueId: string
  ) {

    setCart((prev) =>

      prev
        .map((item) =>

          item.uniqueId === uniqueId

            ? {
                ...item,
                quantity:
                  item.quantity - 1,
              }

            : item
        )

        .filter(
          (item) =>
            item.quantity > 0
        )
    )
  }

const total = cart.reduce((acc, item) => {
  console.log("ITEM DO CARRINHO:", item)
  console.log("PRECO:", item.preco)
  console.log("QUANTITY:", item.quantity)

  return acc + Number(item.preco) * Number(item.quantity)
}, 0)

  const produtosFiltrados =
  produtos.filter(
    (produto: any) => {

      const matchBusca =
        String(produto.nome || "")
          .toLowerCase()
          .includes(
            String(busca || "")
              .toLowerCase()
          )

      return matchBusca
    }
  )


  /* TEMA */

  const bgPage = "bg-white"

  const cardBg = "bg-[#FFFDF9]"

  const borderColor = lightMode
    ? "border-[#DDD6CC]"
    : "border-zinc-800"

  const textPrimary = "text-zinc-900"

  const textSecondary = lightMode
    ? "text-zinc-600"
    : "text-zinc-400"

  const inputBg = lightMode
    ? "bg-white"
    : "bg-zinc-900"



    function obterStatusLoja() {

  if (!aparencia) {
    return "Carregando..."
  }

  const agora = new Date()

  const dias = [
    "dom",
    "seg",
    "ter",
    "qua",
    "qui",
    "sex",
    "sab"
  ]

  const nomesDias = [
    "domingo",
    "segunda",
    "terça",
    "quarta",
    "quinta",
    "sexta",
    "sábado"
  ]

  const diaAtualIndex = agora.getDay()
  const diaAtual = dias[diaAtualIndex]

  // verifica se o dia está ativo
  const ativo = aparencia[`${diaAtual}_ativo`]

  if (ativo === false) {

    for (let i = 1; i <= 7; i++) {

      const proximoIndex = (diaAtualIndex + i) % 7
      const proximoDia = dias[proximoIndex]

      const proximoAtivo =
        aparencia[`${proximoDia}_ativo`]

      const proximoInicio =
        aparencia[`horario_${proximoDia}_inicio`]

      if (proximoAtivo && proximoInicio) {

        if (i === 1) {
          return `Fechado • Abre amanhã às ${proximoInicio}`
        }

        return `Fechado • Abre ${nomesDias[proximoIndex]} às ${proximoInicio}`
      }

    }

    return "Fechado"
  }

  const inicio =
    aparencia[`horario_${diaAtual}_inicio`]

  const fim =
    aparencia[`horario_${diaAtual}_fim`]

  if (!inicio || !fim) {
    return "Fechado"
  }

  const horaAtual =
    agora.getHours() * 60 +
    agora.getMinutes()

  const [hInicio, mInicio] =
    inicio.split(":").map(Number)

  const [hFim, mFim] =
    fim.split(":").map(Number)

  const minutoInicio =
    hInicio * 60 + mInicio

  const minutoFim =
    hFim * 60 + mFim

  if (
    horaAtual >= minutoInicio &&
    horaAtual <= minutoFim
  ) {
    return "Aberto Agora"
  }

  if (horaAtual < minutoInicio) {
    return `Fechado • Abre às ${inicio}`
  }

  for (let i = 1; i <= 7; i++) {

    const proximoIndex = (diaAtualIndex + i) % 7
    const proximoDia = dias[proximoIndex]

    const proximoAtivo =
      aparencia[`${proximoDia}_ativo`]

    const proximoInicio =
      aparencia[`horario_${proximoDia}_inicio`]

    if (proximoAtivo && proximoInicio) {

      if (i === 1) {
        return `Fechado • Abre amanhã às ${proximoInicio}`
      }

      return `Fechado • Abre ${nomesDias[proximoIndex]} às ${proximoInicio}`
    }

  }

  return "Fechado"

}

function obterHorarioFechamento() {

  if (!aparencia) return ""

  const agora = new Date()

  const dias = [
    "dom",
    "seg",
    "ter",
    "qua",
    "qui",
    "sex",
    "sab"
  ]

  const diaAtual =
    dias[agora.getDay()]

  return (
    aparencia[
      `horario_${diaAtual}_fim`
    ] || ""
  )
}

function obterProximaAbertura() {
  if (!aparencia) return ""

  const agora = new Date()

  const dias = [
    "dom",
    "seg",
    "ter",
    "qua",
    "qui",
    "sex",
    "sab",
  ]

  const nomesDias = [
    "domingo",
    "segunda-feira",
    "terça-feira",
    "quarta-feira",
    "quinta-feira",
    "sexta-feira",
    "sábado",
  ]

  const diaAtualIndex = agora.getDay()
  const diaAtual = dias[diaAtualIndex]

  const ativoHoje =
    aparencia[`${diaAtual}_ativo`]

  const inicioHoje =
    aparencia[`horario_${diaAtual}_inicio`]

  // Se hoje funciona e ainda não chegou no horário de abertura
  if (ativoHoje && inicioHoje) {
    const [h, m] = inicioHoje.split(":").map(Number)

    const minutosAbertura = h * 60 + m
    const minutosAgora =
      agora.getHours() * 60 + agora.getMinutes()

    if (minutosAgora < minutosAbertura) {
      return `Hoje às ${inicioHoje}`
    }
  }

  // Procura o próximo dia que funciona
  for (let i = 1; i <= 7; i++) {
    const index = (diaAtualIndex + i) % 7
    const dia = dias[index]

    const ativo =
      aparencia[`${dia}_ativo`]

    const inicio =
      aparencia[`horario_${dia}_inicio`]

    if (ativo && inicio) {
      if (i === 1) {
        return `Amanhã às ${inicio}`
      }

      return `${nomesDias[index]} às ${inicio}`
    }
  }

  return ""
}

const lojaAberta =
  obterStatusLoja().trim().startsWith("Aberto")

if (loadingInicial) {
  return <SplashScreen />;
}


  return (

    <main
      className={`
        min-h-screen
        transition-all
        duration-300
        ${bgPage}
        ${textPrimary}
      `}
    >

      {/* HERO */}

<section
className="
w-full
bg-white
"
>

<div
className="
w-full
h-[190px]
md:h-[340px]
relative
"

style={{
  background: banner
    ? `url(${banner})`
    : `linear-gradient(
        135deg,
        ${corPrincipal} 0%,
        ${corPrincipal}CC 55%,
        #111827 100%
      )`,

  backgroundSize: "cover",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "center",
}}
  >

   {/* ESCURECER BANNER */}

<div
  className="
    absolute
    inset-0
    bg-black/65
    z-10
  "
/>

{/* LOGO CENTRAL */}

{logo && (
<div
className="
absolute
left-1/2
-translate-x-1/2
-bottom-7
z-50
pointer-events-none
"
>
    <div
      className="
        w-28
        h-28
        md:w-40
        md:h-40

        rounded-full
        bg-white

        border-4
        border-white

        shadow-2xl

        overflow-hidden
      "
    >
      <img
        src={logo}
        alt="Logo"
        className="
          w-full
          h-full
          object-cover
        "
      />
    </div>
  </div>
)}

</div>

<div
className="
pt-6
pb-0
shadow-sm
"

>

 <div 
className="
grid
grid-cols-4
text-center
px-4
pb-6
divide-x
divide-zinc-200
items-center
"
 >

    <div>
<Bike
  size={22}
  strokeWidth={1.8}
  className="mx-auto text-zinc-500 mb-2"
/>
      <p className="text-xs font-semibold mt-2">
        Delivery
      </p>
      <p className="mt-1 text-[11px] leading-5 text-zinc-500">
        Taxa a partir de
      </p>
      <p className="text-sm">
        R$ 5,00
      </p>
    </div>

    <div>
      <Clock3
size={22}
className="mx-auto text-zinc-500 mb-2"
/>

<p
  className={`text-xs font-semibold mt-2 ${
    lojaAberta
      ? "text-green-600"
      : "text-red-600"
  }`}
>
  {obterStatusLoja()}
</p>

<p className="mt-1 text-[11px] leading-5 text-zinc-900 font-medium">
  Fecha às {obterHorarioFechamento()}
</p>
    </div>

    <div>
<Wallet
  size={22}
  strokeWidth={1.8}
  className="mx-auto text-zinc-500 mb-2"
/>
      <p className="text-xs font-semibold mt-2">
        Pedido mínimo
      </p>
      <p className="text-sm">
        R$ {Number(
          aparencia?.pedido_minimo || 0
        ).toLocaleString("pt-BR",{
          minimumFractionDigits:2
        })}
      </p>
    </div>

    <div>
      <Star
size={22}
className="mx-auto text-zinc-500 mb-2"
/>
      <p className="text-xs font-semibold mt-2">
        Avaliação
      </p>
      <p className="text-sm">
        4,9
      </p>
    </div>

  </div>

<div className="mx-4 -mt-1 border-t border-zinc-100" />




{fidelidade?.ativo && (
  <div className="mx-3 mt-3 mb-3 rounded-2xl border border-[#E8E1DA] bg-[#FFFDF9] px-3 py-3">

    {/* TÍTULO */}
    <div className="flex items-center justify-center">
      <p className="text-center text-[13px] leading-5 text-zinc-800">
        Junte{" "}
        <strong>
          {fidelidade.pedidos_necessarios} pedidos no Pix
        </strong>{" "}
        e ganhe{" "}
        <strong style={{ color: corPrincipal }}>
          {Number(
            fidelidade.valor_desconto
          ).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </strong>{" "}
        de desconto!
      </p>
    </div>

    {/* SELOS */}
    <div className="mt-3 flex items-center gap-0.5">
      {Array.from({
        length: Number(
          fidelidade.pedidos_necessarios || 10
        ),
      }).map((_, index) => {
        const selos = Number(
          cliente?.selos_pix || 0
        );

        const preenchido = index < selos;

        return (
          <div
            key={index}
            className="flex-1 flex justify-center"
          >
            <Ticket
              size={20}
              strokeWidth={1.8}
              style={{
                color: preenchido
                  ? corPrincipal
                  : "#D6B46A",
                fill: preenchido
                  ? corPrincipal
                  : "transparent",
              }}
            />
          </div>
        );
      })}
    </div>

    {/* MENSAGEM */}
    <p className="mt-3 text-center text-[12px] leading-4 text-zinc-500">
      {Number(cliente?.selos_pix || 0) >=
      Number(
        fidelidade.pedidos_necessarios || 10
      ) ? (
        <strong
          style={{
            color: corPrincipal,
          }}
        >
          Você liberou seu desconto!
        </strong>
      ) : (
        <>
          Faltam{" "}
          <strong>
            {Math.max(
              Number(
                fidelidade.pedidos_necessarios || 10
              ) -
                Number(
                  cliente?.selos_pix || 0
                ),
              0
            )}
          </strong>{" "}
          pedidos no Pix para você liberar seu desconto.
        </>
      )}
    </p>

  </div>
)}













<div
className={`
sticky
top-0
w-full
bg-white
border-b
border-[#ECE8E2]
shadow-sm
${openModal ? "-z-10" : "z-[999]"}
`}
>

<div
className="
max-w-7xl
mx-auto
px-2
pt-3
pb-3
"
>

<div className="relative">

<div
  ref={categoriasRef}
  className="
    flex
    items-center
    justify-start
    gap-2
    overflow-x-auto
    scroll-smooth
    whitespace-nowrap
    scrollbar-hide
    px-4
    md:px-0
  "
>

{categorias.map((categoria, index) => (


<div
  key={categoria}
  className="
    flex
    items-center
    shrink-0
  "
>

<button
   ref={(el) => {
     botoesCategoriaRef.current[categoria] = el
   }}
   id={`botao-${categoria}`}
   onClick={() => {

  setCategoriaSelecionada(categoria)

const categoriaId =
  categoria
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")

const element =
  document.getElementById(
    `categoria-${categoriaId}`
  )

  if (element) {

    const y =
      element.getBoundingClientRect().top +
      window.pageYOffset -
      180

    window.scrollTo({
      top: y,
      behavior: "smooth",
    })
  }
}}
className="
px-3 md:px-6
h-9 md:h-11
text-[13px] md:text-base
rounded-xl
font-semibold
whitespace-nowrap
transition-all
duration-300
"
    style={{
      backgroundColor:
  categoriaSelecionada === categoria
    ? corPrincipal
    : "#FFFFFF",

      color:
        categoriaSelecionada === categoria
          ? "#FFFFFF"
          : "#3F3F46",

          border: "1px solid #E4E4E7"
    }}
  >
    {categoria}
  </button>

</div>

))}


</div>
</div>

          </div>

        </div>

        </div>

<div style={{ height: 1, background: "#FFFFFF" }} />

</section>

<section className="bg-white">

{categorias.map((categoria, indexCategoria) => {

  const produtosCategoria =
    produtosFiltrados.filter(
      (produto) =>
        produto.categoria === categoria
    )

    
  if (
    produtosCategoria.length === 0
  ) {
    return null
  }

const categoriaId =
  categoria
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")


return (

<div
  id={`categoria-${categoriaId}`}
  key={categoria}
  ref={(el) => {
    categoriaRefs.current[categoria] = el
  }}
  className="mb-2 md:mb-14"
>
<h2
  className="
    px-4
    md:px-0

    mt-5
    md:mt-8

    text-[18px]
    md:text-[30px]

    font-semibold

    text-zinc-900

    mb-2
    md:mb-5
  "
>
  {categoria}
</h2>

<div
className={
  indexCategoria === 0
    ? `
        flex
        flex-nowrap
        gap-[6px] md:gap-5
        overflow-x-auto
        overflow-y-hidden
        px-3 md:px-2
        pb-3
        snap-x
        snap-mandatory
        scrollbar-hide
      `
    : `
        flex
        flex-col
        gap-[6px] md:gap-5
        px-3
        md:px-0
      `
}
>

{!produtosCarregados ? (

  [...Array(6)].map((_, index) => (

    <div
      key={index}
      className="
        rounded-3xl
        bg-white
      shadow-[0_8px_22px_rgba(0,0,0,0.07)]
        overflow-hidden
        animate-pulse
      "
    >
      <div className="w-full h-40 bg-zinc-200" />

      <div className="p-4">

        <div className="h-5 w-3/4 bg-zinc-200 rounded" />

        <div className="h-4 w-full bg-zinc-100 rounded mt-3" />

        <div className="h-4 w-2/3 bg-zinc-100 rounded mt-2" />

        <div className="h-8 w-24 bg-zinc-200 rounded-xl mt-5" />

      </div>

    </div>

  ))

) : (

produtosCategoria.map((produto) => (

  indexCategoria === 0 ? (

    <FeaturedProductCard
      key={produto.id}
      product={produto}
      corPrincipal={corPrincipal}
      onClick={() => openProductModal(produto)}
    />

  ) : (

    <ProductCard
      key={produto.id}
      product={produto}
      corPrincipal={corPrincipal}
      onAdd={() => openProductModal(produto)}
    />

  )

))

)}

      </div>

    </div>

  )
})}

</section>

      
      <ProductModal
  open={openModal}
  onClose={() => setOpenModal(false)}
  product={selectedProduct}
  onAdd={addToCart}
  corPrincipal={corPrincipal}
/>

    <CheckoutModal
  open={openCheckout}
  onClose={() => setOpenCheckout(false)}
  cart={cart}
  total={total}
  slug={slug}
  restauranteId={restaurante?.id}
  lojaAberta={obterStatusLoja().includes("Aberto")}
  clearCart={() => {
    setCart([])
    localStorage.removeItem(
  `cart-${slug}`
)
  }}
/>

{cart.length > 0 && (
<div
className="
fixed
bottom-[74px]
left-0
right-0
z-[999]
shadow-2xl
pb-[env(safe-area-inset-bottom)]
"
style={{
  backgroundColor: corPrincipal,
}}
>

<div
  className="
    px-4
    py-4
    flex
    items-center
    justify-between
  "
>
      <div className="flex items-center gap-3">

        <div
          className="
            w-12
            h-12
            rounded-xl
            overflow-hidden
            bg-white
            shrink-0
          "
        >
          {cart[0]?.imagem && (
            <img
              src={cart[0].imagem}
              alt=""
              className="
                w-full
                h-full
                object-cover
              "
            />
          )}
        </div>

        <div className="text-white">

          <p className="font-bold text-sm">
            {cart.reduce(
              (acc, item) =>
                acc + item.quantity,
              0
            )} itens no carrinho
          </p>

          <p className="text-white/80 text-[15px]">
            Total: R$ {total.toLocaleString(
  "pt-BR",
  {
    minimumFractionDigits: 2,
  }
)}
          </p>

        </div>

      </div>

<button
  disabled={carregandoCarrinho}
 onClick={() => {

   if (!lojaAberta) {
  setModalLojaFechada(true)
  return
}

    if (carregandoCarrinho) return;

    setCarregandoCarrinho(true);

    setTimeout(() => {

      window.location.href = `/${slug}/carrinho`;

    }, 300);

}}
  className="
    bg-[#22C55E]
    hover:bg-emerald-600

    text-white
    font-semibold

    px-4
    py-2

    rounded-xl

    flex
    items-center
    justify-center
    gap-3

    transition-all
    duration-200

    active:scale-95

    disabled:opacity-70
    disabled:cursor-not-allowed

    min-w-[140px]
  "
>
  {carregandoCarrinho ? (
    <>
      <div
        className="
          w-5
          h-5
          border-2
          border-white/40
          border-t-white
          rounded-full
          animate-spin
        "
      />
      Carregando...
    </>
  ) : (
    "Ver carrinho"
  )}
</button>

    </div>
  </div>
)}


<div className="-mt-4">
<RestaurantFooter
  corPrincipal={corPrincipal}
/>

<div
  className={
    cart.length > 0
      ? "h-28"
      : "h-0"
  }
/>

</div>

{modalLojaFechada && (
  <div
    className="
      fixed
      inset-0
      z-[99999]
      flex
      items-center
      justify-center
      bg-black/50
      backdrop-blur-[2px]
      px-5
    "
    onClick={() => setModalLojaFechada(false)}
  >
<div
  className="
    w-full
    max-w-[390px]
    bg-white
    rounded-[28px]
    shadow-2xl
    overflow-hidden
  "
  onClick={(e) => e.stopPropagation()}
>

  <div className="px-6 pt-7 pb-6 text-center">

    {/* ÍCONE */}
    
        <div
          className="
            w-16
            h-16
            rounded-full
            mx-auto
            flex
            items-center
            justify-center
            mb-5
          "
          style={{
            backgroundColor: `${corPrincipal}15`,
          }}
        >
          <Clock3
            size={30}
            strokeWidth={2}
            style={{
              color: corPrincipal,
            }}
          />
        </div>

        {/* TÍTULO */}
        <h2
          className="
            text-[22px]
            font-bold
            text-zinc-900
          "
        >
          Estamos fechados no momento
        </h2>

        {/* TEXTO */}
        <p
          className="
            mt-2
            text-[14px]
            leading-6
            text-zinc-500
          "
        >
          No momento não estamos aceitando novos pedidos.
          Você pode voltar quando estivermos abertos.
        </p>

        {/* HORÁRIO */}
        {obterProximaAbertura() && (
          <div
            className="
              mt-5
              rounded-2xl
              px-4
              py-4
            "
            style={{
              backgroundColor: `${corPrincipal}10`,
            }}
          >
            <p
              className="
                text-[12px]
                text-zinc-500
                font-medium
              "
            >
              Voltamos a aceitar pedidos
            </p>

            <p
              className="
                mt-1
                text-[17px]
                font-bold
              "
              style={{
                color: corPrincipal,
              }}
            >
              {obterProximaAbertura()}
            </p>
          </div>
        )}

        {/* BOTÃO */}
        <button
          onClick={() => setModalLojaFechada(false)}
          className="
            mt-6
            w-full
            h-12
            rounded-xl
            text-white
            font-semibold
            text-[15px]
            transition
            active:scale-[0.98]
          "
          style={{
            backgroundColor: corPrincipal,
          }}
        >
          Entendi
        </button>

      </div>
    </div>
  </div>
)}


<BottomNavigation
  corPrincipal={corPrincipal}
/>

</main>
  )
}