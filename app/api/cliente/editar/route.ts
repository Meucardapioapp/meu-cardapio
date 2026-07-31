import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function PUT(req: Request) {

  try {

    const {
      token,
      nome,
      telefone,
      cpf,
    } = await req.json();

    if (!token) {

      return NextResponse.json({
        success: false,
        error: "Token não informado.",
      });

    }

    const { data: cliente } = await supabaseAdmin
      .from("clientes")
      .select("id")
      .eq("token_acesso", token)
      .single();

    if (!cliente) {

      return NextResponse.json({
        success: false,
        error: "Cliente não encontrado.",
      });

    }

    const { error } = await supabaseAdmin
      .from("clientes")
      .update({

        nome,

        telefone,

        cpf,

      })
      .eq("id", cliente.id);

    if (error) {

      return NextResponse.json({
        success: false,
        error: error.message,
      });

    }

    return NextResponse.json({
      success: true,
    });

  } catch (err: any) {

    return NextResponse.json({
      success: false,
      error: err.message,
    });

  }

}