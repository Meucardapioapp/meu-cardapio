import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const authorization = req.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Não autenticado",
        },
        { status: 401 }
      );
    }

    const token = authorization.slice(7).trim();

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Sessão inválida ou expirada",
        },
        { status: 401 }
      );
    }

    const {
      data: restaurante,
      error: restauranteError,
    } = await supabaseAdmin
      .from("restaurantes")
      .select(
        `
        id,
        nome_restaurante,
        cpf_cnpj,
        banco,
        agencia,
        conta,
        tipo_conta,
        pagarme_recipient_id
        `
      )
      .eq("auth_user_id", user.id)
      .single();

    if (restauranteError || !restaurante) {
      return NextResponse.json(
        {
          success: false,
          error: "Restaurante não encontrado para este usuário",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      restaurante,
    });
  } catch (error) {
    console.error("Erro /api/restaurante:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}