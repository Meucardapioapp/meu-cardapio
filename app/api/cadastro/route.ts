import { NextRequest, NextResponse, after } from "next/server"
import { emailBoasVindas } from "@/lib/server/notificacoes"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { criarTesteGratis } from "@/lib/server/assinatura"
import { limitar } from "@/lib/server/rate-limit"
import { senhaValida } from "@/lib/senha"
import { verificarHumano } from "@/lib/server/turnstile"
import { ipDaRequisicao } from "@/lib/server/rate-limit"
import { esquemaCadastro, primeiroErro } from "@/lib/esquemas"

export async function POST(req: NextRequest) {
  let userId: string | null = null

  try {
    if (!await limitar(req, "cadastro", 5, 3600)) {
      return NextResponse.json(
        { success: false, error: "Muitos cadastros a partir desta rede. Tente novamente mais tarde." },
        { status: 429 }
      )
    }

    const body = await req.json()

    // Armadilha: campo invisível preenchido = robô.
    if (body?.siteEmpresa) {
      return NextResponse.json({ success: false, error: "Não foi possível concluir o cadastro." }, { status: 400 })
    }

    if (!(await verificarHumano(body?.captchaToken, ipDaRequisicao(req)))) {
      return NextResponse.json(
        { success: false, error: "Confirme que você não é um robô e tente de novo." },
        { status: 400 }
      )
    }

    if (body?.aceiteTermos !== true) {
      return NextResponse.json(
        { success: false, error: "Aceite os Termos de Uso e a Política de Privacidade para continuar." },
        { status: 400 }
      )
    }

    const validacao = esquemaCadastro.safeParse(body)

    if (!validacao.success) {
      return NextResponse.json(
        { success: false, error: primeiroErro(validacao.error) },
        { status: 400 }
      )
    }

    const {
      nomeResponsavel,
      nomeRestaurante,
      telefone,
      whatsapp,
      cidade,
      estado,
      uf,
      slug,
      categoria,
      email,
      senha,
    } = validacao.data

    // 1. Verifica os campos obrigatórios
    if (
      !nomeResponsavel ||
      !nomeRestaurante ||
      !telefone ||
      !whatsapp ||
      !cidade ||
      !slug ||
      !email ||
      !senha
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Preencha todos os campos obrigatórios.",
        },
        { status: 400 }
      )
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(slug)) || String(slug).length > 60) {
      return NextResponse.json(
        { success: false, error: "O link do cardápio só pode ter letras minúsculas, números e hífen." },
        { status: 400 }
      )
    }

    // Endereços usados pelo próprio sistema não podem virar link de cardápio.
    const RESERVADOS = ["entregador", "equipe", "garcom", "cozinha", "admin", "api", "login", "cadastro", "pedido", "pix", "termos", "privacidade", "imprimir", "sucesso", "seguranca", "financeiro"]
    if (RESERVADOS.includes(String(slug))) {
      return NextResponse.json(
        { success: false, error: "Esse link já é usado pelo sistema. Escolha outro." },
        { status: 400 }
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return NextResponse.json(
        { success: false, error: "Informe um e-mail válido." },
        { status: 400 }
      )
    }

    if (!senhaValida(String(senha))) {
      return NextResponse.json(
        {
          success: false,
          error: "A senha precisa ter 8 ou mais caracteres, com letra maiúscula, minúscula, número e caractere especial.",
        },
        { status: 400 }
      )
    }

    // 2. Verifica se o slug/nome do restaurante já existe
    const {
      data: restauranteExistente,
      error: erroVerificacao,
    } = await supabaseAdmin
      .from("restaurantes")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()

    if (erroVerificacao) {
      console.error(
        "Erro ao verificar restaurante:",
        erroVerificacao
      )

      return NextResponse.json(
        {
          success: false,
          error:
            "Não foi possível verificar o nome do restaurante.",
        },
        { status: 500 }
      )
    }

    if (restauranteExistente) {
      return NextResponse.json(
        {
          success: false,
          code: "SLUG_ALREADY_EXISTS",
          error:
            "Este nome de restaurante já está em uso. Escolha outro nome.",
        },
        { status: 409 }
      )
    }

    // 3. Cria o usuário no Supabase Auth
    const {
      data: authData,
      error: authError,
    } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      console.error(
        "Erro ao criar usuário:",
        authError
      )

      const emailJaExiste =
        authError?.message
          ?.toLowerCase()
          .includes("already") ||
        authError?.message
          ?.toLowerCase()
          .includes("registered")

      return NextResponse.json(
        {
          success: false,
          code: emailJaExiste
            ? "EMAIL_ALREADY_EXISTS"
            : "AUTH_ERROR",
          error: emailJaExiste
            ? "Este e-mail já possui uma conta."
            : "Não foi possível criar sua conta.",
        },
        {
          status: emailJaExiste ? 409 : 500,
        }
      )
    }

    userId = authData.user.id

    // 4. Cria o restaurante
    const {
      data: restaurante,
      error: restauranteError,
    } = await supabaseAdmin
      .from("restaurantes")
      .insert({
        auth_user_id: userId,
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

    // 5. Se o restaurante falhar, apaga o usuário criado no Auth
    if (restauranteError || !restaurante) {
      console.error(
        "Erro ao criar restaurante:",
        restauranteError
      )

      if (userId) {
        const { error: deleteError } =
          await supabaseAdmin.auth.admin.deleteUser(
            userId
          )

        if (deleteError) {
          console.error(
            "Erro ao remover usuário após falha:",
            deleteError
          )
        }
      }

      return NextResponse.json(
        {
          success: false,
          error:
            "Não foi possível concluir o cadastro do restaurante.",
        },
        { status: 500 }
      )
    }

// Registra quando os termos foram aceitos (coluna do SQL 08; se faltar, segue).
{
  const { error: erroAceite } = await supabaseAdmin
    .from("restaurantes")
    .update({ termos_aceitos_em: new Date().toISOString() })
    .eq("id", restaurante.id)
  if (erroAceite) console.error("[cadastro] termos_aceitos_em", erroAceite.message)
}

// 6. Começa o teste grátis (15 dias)
try {
  await criarTesteGratis(String(restaurante.id))
} catch (erroTeste) {
  console.error("Erro ao criar teste grátis:", erroTeste)
}

// E-mail de boas-vindas (depois da resposta, não atrasa o cadastro)
after(() => emailBoasVindas(String(restaurante.id)).catch(() => {}))

// 7. Envia notificação de novo restaurante para o Pushcut
try {
  const pushcutUrl =
    process.env.PUSHCUT_NOVO_RESTAURANTE_URL

  if (pushcutUrl) {
    const pushcutResponse = await fetch(pushcutUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "🎉 Novo restaurante cadastrado!",
        text: `Restaurante: ${nomeRestaurante}
Responsável: ${nomeResponsavel}
Categoria: ${categoria || "Não informada"}
Cidade: ${cidade} - ${uf}
WhatsApp: ${whatsapp}`,
      }),
    })

    if (!pushcutResponse.ok) {
      console.error(
        "Pushcut respondeu com erro:",
        pushcutResponse.status
      )
    }
  } else {
    console.warn(
      "PUSHCUT_NOVO_RESTAURANTE_URL não configurada na Vercel."
    )
  }
} catch (pushcutError) {
  console.error(
    "Erro ao enviar notificação para o Pushcut:",
    pushcutError
  )
}

// 8. Cadastro concluído
return NextResponse.json({
  success: true,
  restaurante: {
    id: restaurante.id,
    slug: restaurante.slug,
  },
})
  } catch (error) {
    console.error(
      "Erro inesperado no cadastro:",
      error
    )

    // Segurança extra:
    // se algo falhar depois da criação do usuário,
    // tenta remover o usuário do Auth
    if (userId) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(
          userId
        )
      } catch (deleteError) {
        console.error(
          "Erro ao limpar usuário:",
          deleteError
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Ocorreu um erro inesperado ao criar sua conta.",
      },
      { status: 500 }
    )
  }
}