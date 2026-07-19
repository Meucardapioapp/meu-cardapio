import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: NextRequest) {
  let userId: string | null = null

  try {
    const body = await req.json()

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
    } = body

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

    // 6. Cadastro concluído
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