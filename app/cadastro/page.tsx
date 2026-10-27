"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import Turnstile, { type TurnstileRef } from "@/app/components/Turnstile"

import { supabase } from "@/lib/supabase"
import Toast from "@/app/components/ui/toast"
import MedidorSenha from "@/app/components/MedidorSenha"
import { senhaValida } from "@/lib/senha"
import PixelComConsentimento from "@/app/components/PixelComConsentimento"
import { PIXEL_PLATAFORMA, rastrearPixel } from "@/lib/pixel-plataforma"


function gerarSlug(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
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

// Estados do Brasil (lista fixa: o cadastro não depende de nenhum site externo).
const ESTADOS_BR = [
  ["AC", "Acre"], ["AL", "Alagoas"], ["AP", "Amapá"], ["AM", "Amazonas"], ["BA", "Bahia"],
  ["CE", "Ceará"], ["DF", "Distrito Federal"], ["ES", "Espírito Santo"], ["GO", "Goiás"],
  ["MA", "Maranhão"], ["MT", "Mato Grosso"], ["MS", "Mato Grosso do Sul"], ["MG", "Minas Gerais"],
  ["PA", "Pará"], ["PB", "Paraíba"], ["PR", "Paraná"], ["PE", "Pernambuco"], ["PI", "Piauí"],
  ["RJ", "Rio de Janeiro"], ["RN", "Rio Grande do Norte"], ["RS", "Rio Grande do Sul"],
  ["RO", "Rondônia"], ["RR", "Roraima"], ["SC", "Santa Catarina"], ["SP", "São Paulo"],
  ["SE", "Sergipe"], ["TO", "Tocantins"],
].map(([sigla, nome]) => ({ id: sigla, sigla, nome }));


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
const [estado, setEstado] = useState("");
const [uf, setUf] = useState("");
const turnstile = useRef<TurnstileRef>(null);
const [siteEmpresa, setSiteEmpresa] = useState(""); // armadilha para robôs
const [aceite, setAceite] = useState(false);
const [estados, setEstados] = useState<any[]>([]);

useEffect(() => {

  carregarEstados();

}, []);

function carregarEstados() {

  setEstados(ESTADOS_BR);

}

function buscarCidade(valor: string) {

  // Cidade digitada à mão pelo dono do restaurante (sem consultar o IBGE).
  const texto = valor.replace(/\s+/g, " ").slice(0, 60);

  setBuscaCidade(texto);

  setCidade(texto.trim());

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
        mensagem: "Preencha todos os campos para continuar.",
      })

      setTimeout(() => {
        setToast(null)
      }, 5000)

      return
    }

    const partesNome = nomeResponsavel.trim().split(/\s+/).filter(Boolean)

    if (partesNome.length < 2 || nomeResponsavel.trim().length > 30) {
      setToast({
        tipo: "aviso",
        titulo: "Confira seu nome",
        mensagem: "Escreva só seu nome e sobrenome (até 30 letras). Ex.: Maria Silva.",
      })

      setTimeout(() => {
        setToast(null)
      }, 5000)

      return
    }

    if (!aceite) {
      setToast({
        tipo: "aviso",
        titulo: "Termos de uso",
        mensagem: "Para criar a conta, marque que leu e aceita os Termos de Uso e a Política de Privacidade.",
      })

      setTimeout(() => {
        setToast(null)
      }, 5000)

      return
    }

    if (!senhaValida(senha)) {
      setToast({
        tipo: "aviso",
        titulo: "Senha fraca",
        mensagem: "Use 8 ou mais caracteres com letra maiúscula, minúscula, número e caractere especial.",
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
        mensagem: "Digite a mesma senha nos dois campos.",
      })

      setTimeout(() => {
        setToast(null)
      }, 5000)

      return
    }

    const slugGerado = gerarSlug(nomeRestaurante)

    const captchaToken = await turnstile.current?.obterToken()

    const response = await fetch("/api/cadastro", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nomeResponsavel: nomeResponsavel.trim().replace(/\s+/g, " "),
        nomeRestaurante,
        telefone,
        whatsapp,
        cidade,
        estado,
        uf,
        slug: slugGerado,
        categoria,
        email,
        senha,
        captchaToken,
        siteEmpresa,
        aceiteTermos: aceite,
      }),
    })

    const resultado = await response.json()

    if (!response.ok || !resultado.success) {

      if (resultado.code === "SLUG_ALREADY_EXISTS") {
        setToast({
          tipo: "aviso",
          titulo: "Este nome já está em uso",
          mensagem:
            "Escolha outro nome para o seu restaurante e tente novamente.",
        })

        setTimeout(() => {
          setToast(null)
        }, 7000)

        return
      }

      if (resultado.code === "EMAIL_ALREADY_EXISTS") {
        setToast({
          tipo: "aviso",
          titulo: "Este e-mail já possui uma conta",
          mensagem:
            "Use outro e-mail ou entre na sua conta existente.",
        })

        setTimeout(() => {
          setToast(null)
        }, 7000)

        return
      }

      setToast({
        tipo: "erro",
        titulo: "Cadastro não realizado",
        mensagem:
          resultado.error ||
          "Não foi possível concluir seu cadastro.",
      })

      setTimeout(() => {
        setToast(null)
      }, 5000)

      return
    }

    localStorage.setItem(
      "restaurante_id",
      resultado.restaurante.id
    )

    // Já entra logado no painel.
    const tokenLogin = await turnstile.current?.obterToken()
    await supabase.auth.signInWithPassword({
      email,
      password: senha,
      options: tokenLogin ? { captchaToken: tokenLogin } : undefined,
    })

    // Meta Pixel: conta o cadastro concluído (é o que os anúncios otimizam).
    rastrearPixel("CompleteRegistration", { content_name: "cadastro_restaurante" })

    // O painel guia o próximo passo (o item certo do menu fica piscando).
    router.push("/admin")

  } catch (error) {

    console.error(
      "Erro ao realizar cadastro:",
      error
    )

    setToast({
      tipo: "erro",
      titulo: "Erro inesperado",
      mensagem:
        "Ocorreu um problema ao criar sua conta. Tente novamente.",
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
      {PIXEL_PLATAFORMA && <PixelComConsentimento pixelId={PIXEL_PLATAFORMA} />}

      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[32px] border border-[#ECE7E3] bg-white shadow-2xl lg:grid-cols-2">

        {/* LADO ESQUERDO */}
        <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-[#6D1F2F] via-[#7B2335] to-[#43111B] p-12 text-white">



          <h1 className="mt-6 text-6xl font-black leading-tight">
  Comece a vender online ainda hoje
</h1>

        <p className="mt-6 text-lg leading-relaxed text-white/80">
  Crie seu cardápio digital profissional, receba pedidos com alerta sonoro
  e acompanhe tudo em um único painel.
</p>

          <div className="mt-10 space-y-5">
            {[
              "15 dias grátis, sem cartão de crédito",
              "Cardápio digital com seu link e sua marca",
              "Pedidos ilimitados, sem taxa por pedido",
              "Alerta sonoro e impressão de pedidos",
              "Cupons de desconto e programa de fidelidade",
              "Depois do teste: R$ 79,90/mês, tudo incluído",
              "Suporte pelo WhatsApp",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span>✅</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

        </div>

        {/* LADO DIREITO */}
        <div className="flex flex-col justify-center p-8 md:p-12">

        <h2 className="text-4xl font-black text-black">
  Crie sua Conta
</h2>

          <p className="mt-2 text-zinc-500">
            Teste grátis por 15 dias. Monte seu cardápio em menos de 5 minutos.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">

            <div>
              <input
                type="text"
                placeholder="Seu nome e sobrenome"
                value={nomeResponsavel}
                maxLength={30}
                autoComplete="name"
                onChange={(e) =>
                  setNomeResponsavel(e.target.value.replace(/\s{2,}/g, " "))
                }
                className="w-full rounded-2xl border border-[#E7E5E4] bg-[#F8F6F4] p-4 outline-none focus:border-[#6D1F2F]"
              />
              <p className="mt-1 px-1 text-xs text-zinc-500">
                Só nome e sobrenome, ex.: Maria Silva ({nomeResponsavel.length}/30)
              </p>
            </div>

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
    placeholder="Sua cidade"
    autoComplete="address-level2"
    maxLength={60}
    value={buscaCidade}
    onChange={(e) => buscarCidade(e.target.value)}
    className="w-full rounded-2xl border border-[#E7E5E4] bg-[#F8F6F4] p-4 outline-none focus:border-[#6D1F2F]"
  />

  
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
            autoComplete="new-password"
            className="mt-4 w-full rounded-2xl border border-[#E7E5E4] bg-[#F8F6F4] p-4 outline-none focus:border-[#6D1F2F]"
          />

          <MedidorSenha senha={senha} />

          <input
            type="password"
            autoComplete="new-password"
            placeholder="Confirmar senha"
            value={confirmarSenha}
            onChange={(e) =>
              setConfirmarSenha(e.target.value)
            }
            className="mt-4 w-full rounded-2xl border border-[#E7E5E4] bg-[#F8F6F4] p-4 outline-none focus:border-[#6D1F2F]"
          />

          {confirmarSenha && confirmarSenha !== senha && (
            <p className="mt-2 text-sm text-red-600">As senhas não são iguais.</p>
          )}

          {/* Campo invisível: pessoas não veem, robôs preenchem */}
          <input
            type="text"
            name="site_empresa"
            value={siteEmpresa}
            onChange={(e) => setSiteEmpresa(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
          />

          <label className="mt-5 flex items-start gap-3 text-sm text-zinc-600">
            <input
              type="checkbox"
              checked={aceite}
              onChange={(e) => setAceite(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[#6D1F2F]"
            />
            <span>
              Li e aceito os{" "}
              <a href="/termos" target="_blank" rel="noreferrer" className="font-semibold text-[#6D1F2F] underline">Termos de Uso</a>{" "}
              e a{" "}
              <a href="/privacidade" target="_blank" rel="noreferrer" className="font-semibold text-[#6D1F2F] underline">Política de Privacidade</a>.
              Depois dos 15 dias grátis, o plano custa R$ 79,90/mês.
            </span>
          </label>

          <Turnstile ref={turnstile} />

          <button
            onClick={cadastrar}
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-[#6D1F2F] p-4 font-bold text-white shadow-lg transition hover:bg-[#531723] disabled:opacity-50"
          >
            {loading
              ? "Criando conta..."
              : "Começar meus 15 dias grátis"}
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