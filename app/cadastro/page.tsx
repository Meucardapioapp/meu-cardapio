"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"
import Toast from "@/app/components/ui/toast"


function gerarSlug(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
}

function formatarTelefone(valor: string) {
  const numero = valor.replace(/\D/g, "").slice(0, 11);

  if (numero.length <= 2) {
    return numero;
  }

  if (numero.length <= 7) {
    return `(${numero.slice(0, 2)}) ${numero.slice(2)}`;
  }

  return `(${numero.slice(0, 2)}) ${numero.slice(2, 7)}-${numero.slice(7)}`;
}

export default function CadastroPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{
  tipo: "sucesso" | "erro" | "aviso"
  titulo: string
  mensagem: string
} | null>(null)

  const [nomeResponsavel, setNomeResponsavel] = useState("")
  const [nomeRestaurante, setNomeRestaurante] = useState("")
  const [telefone, setTelefone] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [cidade, setCidade] = useState("")
  const [slug, setSlug] = useState("")
  const [categoria, setCategoria] = useState("Açaí")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [buscaCidade, setBuscaCidade] = useState("");
const [cidades, setCidades] = useState<any[]>([]);
const [mostrarLista, setMostrarLista] = useState(false);
const [estado, setEstado] = useState("");
const [uf, setUf] = useState("");
const [estados, setEstados] = useState<any[]>([]);

useEffect(() => {

  carregarEstados();

}, []);

async function carregarEstados() {

  const response = await fetch(
    "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome"
  );

  const data = await response.json();

  setEstados(data);

}

async function buscarCidade(valor: string) {

  setBuscaCidade(valor);

  if (!uf) {

    alert("Escolha primeiro um estado.");

    return;

  }

  if (valor.length < 2) {

    setMostrarLista(false);
    setCidades([]);

    return;

  }

const resposta = await fetch(

`/api/cidades?uf=${uf}&search=${encodeURIComponent(valor)}`

);

  const dados = await resposta.json();

  console.log(dados);

  setCidades(dados);

  setMostrarLista(true);

}

  async function cadastrar() {
    try {
      setLoading(true)

      if (
  !nomeResponsavel ||
  !nomeRestaurante ||
  !telefone ||
  !whatsapp ||
  !cidade ||
  !email ||
  !senha ||
  !confirmarSenha
) {
  setToast({
    tipo: "aviso",
    titulo: "Campos obrigatórios",
    mensagem:
      "Preencha todos os campos para continuar."
  })

  setTimeout(() => {
    setToast(null)
  }, 5000)

  return
}

      if (senha !== confirmarSenha) {
  setToast({
    tipo: "aviso",
    titulo: "Senhas diferentes",
    mensagem:
      "Digite a mesma senha nos dois campos."
  })

  setTimeout(() => {
    setToast(null)
  }, 5000)

  return
}

      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
      })

      if (error) {

  let mensagem =
    "Não foi possível criar sua conta."

  if (
    error.message.includes(
      "User already registered"
    )
  ) {
    mensagem =
      "Este e-mail já possui uma conta."
  }

  setToast({
    tipo: "erro",
    titulo: "Cadastro não realizado",
    mensagem
  })

  setTimeout(() => {
    setToast(null)
  }, 5000)

  return
}

      const user = data.user

      if (!user) {
  setToast({
    tipo: "erro",
    titulo: "Erro ao criar conta",
    mensagem:
      "Não foi possível criar seu usuário."
  })

  setTimeout(() => {
    setToast(null)
  }, 5000)

  return
}

console.log("CIDADE:", cidade);
console.log("ESTADO:", estado);
console.log("UF:", uf);

      const {
        data: restaurante,
        error: restauranteError,
      } = await supabase
        .from("restaurantes")
.insert({

  auth_user_id: user.id,

  nome_responsavel: nomeResponsavel,

  nome_restaurante: nomeRestaurante,

  telefone,

  whatsapp,

  cidade,

  estado,

  uf,

  slug,

  categoria,

  email,

})
        .select()
        .single()

      if (restauranteError) {
  setToast({
    tipo: "erro",
    titulo: "Erro ao salvar restaurante",
    mensagem:
      "Não foi possível concluir seu cadastro."
  })

  setTimeout(() => {
    setToast(null)
  }, 5000)

  return
}

      localStorage.setItem(
        "restaurante_id",
        restaurante.id
      )

    router.push("/admin")
} catch (error) {
  console.error(error)

  setToast({
    tipo: "erro",
    titulo: "Erro inesperado",
    mensagem:
      "Ocorreu um problema ao criar sua conta."
  })

  setTimeout(() => {
    setToast(null)
  }, 5000)

} finally {
  setLoading(false)
}

}

  return (
  <>
    {toast && (
      <Toast
        tipo={toast.tipo}
        titulo={toast.titulo}
        mensagem={toast.mensagem}
      />
    )}

    <main className="min-h-screen bg-[#F8F6F4] px-4 py-10">

      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[32px] border border-[#ECE7E3] bg-white shadow-2xl lg:grid-cols-2">

        {/* LADO ESQUERDO */}
        <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-[#6D1F2F] via-[#7B2335] to-[#43111B] p-12 text-white">



          <h1 className="mt-6 text-6xl font-black leading-tight">
  Comece a vender online ainda hoje
</h1>

        <p className="mt-6 text-lg leading-relaxed text-white/80">
  Crie seu cardápio digital profissional, receba pedidos pelo WhatsApp,
  aceite PIX e cartão e acompanhe tudo em um único painel.
</p>  

          <div className="mt-10 space-y-5">

            <div className="flex items-center gap-3">
              <span>✅</span>
              <span>Cardápio Digital Ilimitado</span>
            </div>

            <div className="flex items-center gap-3">
              <span>✅</span>
              <span>Pedidos Ilimitados</span>
            </div>

            <div className="flex items-center gap-3">
              <span>✅</span>
              <span>PIX e Cartão Integrados</span>
            </div>

            <div className="flex items-center gap-3">
              <span>✅</span>
              <span>Dashboard Financeiro</span>
            </div>

            <div className="flex items-center gap-3">
              <span>✅</span>
              <span>Sem Mensalidade</span>
            </div>

            <div className="flex items-center gap-3">
 
  <span>✅</span>
  <span>Suporte Premium</span>
  
</div>


</div>

        </div>

        {/* LADO DIREITO */}
        <div className="flex flex-col justify-center p-8 md:p-12">

        <h2 className="text-4xl font-black text-black">
  Crie sua Conta
</h2>

          <p className="mt-2 text-zinc-500">
            Monte seu cardápio digital em menos de 5 minutos.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">

            <input
              type="text"
              placeholder="Seu nome completo"
              value={nomeResponsavel}
              onChange={(e) =>
                setNomeResponsavel(e.target.value)
              }
              className="rounded-2xl border border-[#E7E5E4] bg-[#F8F6F4] p-4 outline-none focus:border-[#6D1F2F]"
            />

            <div>
  <input
    type="text"
    placeholder="Nome da sua empresa"
    value={nomeRestaurante}
    onChange={(e) => {
      const valor = e.target.value

      setNomeRestaurante(valor)
      setSlug(gerarSlug(valor))
    }}
    className="w-full rounded-2xl border border-[#E7E5E4] bg-[#F8F6F4] p-4 outline-none focus:border-[#6D1F2F]"
  />

<div className="mt-2 rounded-xl bg-[#F3F0EE] px-3 py-3 text-sm font-medium text-[#6D1F2F]">
  meucardapio.app/{slug || "seu-restaurante"}
</div>
</div>

            <input
              type="text"
              placeholder="Telefone"
              value={telefone}
              onChange={(e) =>
                setTelefone(formatarTelefone(e.target.value))
              }
              className="rounded-2xl border border-[#E7E5E4] bg-[#F8F6F4] p-4 outline-none focus:border-[#6D1F2F]"
            />

            <input
              type="text"
              placeholder="WhatsApp"
              value={whatsapp}
              onChange={(e) =>
                setWhatsapp(formatarTelefone(e.target.value))
              }
              className="rounded-2xl border border-[#E7E5E4] bg-[#F8F6F4] p-4 outline-none focus:border-[#6D1F2F]"
            />

<select

  value={uf}

  onChange={(e) => {

    setUf(e.target.value);

    const estadoSelecionado = estados.find(

      (estado: any) => estado.sigla === e.target.value

    );

    setEstado(estadoSelecionado?.nome || "");

    setCidade("");

    setBuscaCidade("");

  }}

  className="w-full rounded-2xl border border-[#E7E5E4] bg-[#F8F6F4] p-4"

>

<option value="">

Escolha o estado

</option>

{estados.map((estado: any) => (

<option

key={estado.id}

value={estado.sigla}

>

{estado.nome}

</option>

))}

</select>



<div className="relative">
  <input
    type="text"
    placeholder="Cidade"
    value={buscaCidade}
    onChange={(e) => buscarCidade(e.target.value)}
    className="w-full rounded-2xl border border-[#E7E5E4] bg-[#F8F6F4] p-4 outline-none focus:border-[#6D1F2F]"
  />

  {mostrarLista && cidades.length > 0 && (
    <div className="absolute z-50 mt-2 w-full rounded-2xl border bg-white shadow-xl max-h-64 overflow-auto">
      {cidades.map((cidadeItem: any) => (
        <button
          type="button"
          key={cidadeItem.id}
onClick={() => {

  setCidade(cidadeItem.nome);

  setBuscaCidade(
    `${cidadeItem.nome} - ${uf}`
  );

  setMostrarLista(false);

}}
          className="block w-full px-4 py-3 text-left hover:bg-zinc-100"
        >
   {cidadeItem.nome} - {uf}
        </button>
      ))}
    </div>
  )}
</div>

<select
  
 value={categoria}
  onChange={(e) =>
    setCategoria(e.target.value)
  }
  className="rounded-2xl border border-[#E7E5E4] bg-[#F8F6F4] p-4 outline-none focus:border-[#6D1F2F]"
>
  <option>Açaiteria</option>
  <option>Hamburgueria</option>
  <option>Pizzaria</option>
  <option>Restaurante</option>
  <option>Cafeteria</option>
  <option>Sushi</option>
  <option>Outros</option>
</select>

 

          </div>

        
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="mt-4 w-full rounded-2xl border border-[#E7E5E4] bg-[#F8F6F4] p-4 outline-none focus:border-[#6D1F2F]"
          />

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) =>
              setSenha(e.target.value)
            }
            className="mt-4 w-full rounded-2xl border border-[#E7E5E4] bg-[#F8F6F4] p-4 outline-none focus:border-[#6D1F2F]"
          />

          <input
            type="password"
            placeholder="Confirmar senha"
            value={confirmarSenha}
            onChange={(e) =>
              setConfirmarSenha(e.target.value)
            }
            className="mt-4 w-full rounded-2xl border border-[#E7E5E4] bg-[#F8F6F4] p-4 outline-none focus:border-[#6D1F2F]"
          />

          <button
            onClick={cadastrar}
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-[#6D1F2F] p-4 font-bold text-white shadow-lg transition hover:bg-[#531723] disabled:opacity-50"
          >
            {loading
              ? "Criando conta..."
              : "Criar Minha Conta Grátis"}
          </button>

          <p className="mt-6 text-center text-zinc-500">
            Já possui conta?{" "}

            <Link
              href="/login"
              className="font-bold text-[#6D1F2F]"
            >
              Entrar
            </Link>
          </p>

        </div>

      </div>

        </main>
  </>
)
}