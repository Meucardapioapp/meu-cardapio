import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Token não informado",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // CLIENTE
    // ==========================================

    const {
      data: cliente,
      error: clienteError,
    } = await supabaseAdmin
      .from("clientes")
      .select("*")
      .eq("token_acesso", token)
      .single();

    console.log("========== API CLIENTE ==========");
    console.log("TOKEN:", token);
    console.log("CLIENTE:", cliente);
    console.log("ERRO CLIENTE:", clienteError);

    if (clienteError || !cliente) {
      return NextResponse.json(
        {
          success: false,
          error: "Cliente não encontrado",
          detalhes: clienteError?.message ?? null,
        },
        { status: 404 }
      );
    }

    // ==========================================
    // ENDEREÇOS
    // ==========================================

    const {
      data: enderecos,
      error: enderecosError,
    } = await supabaseAdmin
      .from("enderecos_cliente")
      .select("*")
      .eq("cliente_id", cliente.id);

    console.log("ENDEREÇOS:", enderecos);
    console.log("ERRO ENDEREÇOS:", enderecosError);

    // ==========================================
    // PEDIDOS
    // ==========================================

    const {
      data: pedidos,
      error: pedidosError,
    } = await supabaseAdmin
      .from("pedidos")
      .select("*")
      .eq("cliente_id", cliente.id)
      .eq("confirmado", true)
      .order("created_at", {
        ascending: false,
      });

    console.log("PEDIDOS:", pedidos);
    console.log("ERRO PEDIDOS:", pedidosError);

    // ==========================================
    // FIDELIDADE
    // ==========================================

    const {
      data: fidelidades,
      error: fidelidadeError,
    } = await supabaseAdmin
      .from("cliente_fidelidade")
      .select("*")
      .eq("cliente_id", cliente.id);

    console.log("========== FIDELIDADE ==========");
    console.log("CLIENTE ID:", cliente.id);
    console.log(
      "RESTAURANTE ID:",
      cliente.restaurante_id
    );
    console.log(
      "FIDELIDADES:",
      fidelidades
    );
    console.log(
      "ERRO FIDELIDADE:",
      fidelidadeError
    );

    // Se houver erro na tabela de fidelidade,
    // NÃO derruba a API inteira.
    if (fidelidadeError) {
      return NextResponse.json({
        success: true,
        cliente,
        enderecos: enderecos ?? [],
        pedidos: pedidos ?? [],
        fidelidade: null,
        fidelidade_error: {
          message: fidelidadeError.message,
          details: fidelidadeError.details,
          hint: fidelidadeError.hint,
          code: fidelidadeError.code,
        },
      });
    }

    // ==========================================
    // PEGA A FIDELIDADE DO RESTAURANTE ATUAL
    // ==========================================

    const fidelidade =
      fidelidades?.find(
        (item) =>
          item.restaurante_id ===
          cliente.restaurante_id
      ) ?? null;

    console.log(
      "FIDELIDADE FINAL:",
      fidelidade
    );

    // ==========================================
    // RESPOSTA
    // ==========================================

    return NextResponse.json({
      success: true,
      cliente,
      enderecos: enderecos ?? [],
      pedidos: pedidos ?? [],
      fidelidade,
    });
  } catch (error: any) {
    console.error(
      "========== ERRO GERAL API CLIENTE =========="
    );

    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        detalhes: error?.message ?? String(error),
        stack: error?.stack ?? null,
      },
      { status: 500 }
    );
  }
}