import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get("authorization")

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const token = authorization.replace("Bearer ", "").trim()

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 401 }
      )
    }

    if (user.id !== process.env.OWNER_USER_ID) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from("restaurantes")
      .select("id, nome_restaurante, whatsapp, slug")
      .order("nome", { ascending: true })

    if (error) {
      console.error("Erro ao buscar restaurantes:", error)

      return NextResponse.json(
        { error: "Erro ao buscar restaurantes" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      restaurantes: data ?? [],
    })
  } catch (error) {
    console.error("Erro na API de contatos:", error)

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}