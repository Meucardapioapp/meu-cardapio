import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false },
        { status: 400 }
      );
    }

    const { data: cliente, error } = await supabaseAdmin
      .from("clientes")
      .select("*")
      .eq("token_acesso", token)
      .single();

    if (error || !cliente) {
      return NextResponse.json(
        { success: false },
        { status: 404 }
      );
    }

    const { data: enderecos } = await supabaseAdmin
      .from("enderecos_cliente")
      .select("*")
      .eq("cliente_id", cliente.id)
      .order("principal", { ascending: false });

    // ==========================================
    // FIDELIDADE DO CLIENTE
    // ==========================================

    const { data: fidelidade, error: fidelidadeError } =
      await supabaseAdmin
        .from("cliente_fidelidade")
        .select(`
          id,
          cliente_id,
          restaurante_id,
          selos,
          desconto_disponivel,
          ultimo_resgate,
          created_at,
          updated_at
        `)
        .eq("cliente_id", cliente.id)
        .maybeSingle();

    if (fidelidadeError) {
      console.error(
        "Erro ao buscar fidelidade:",
        fidelidadeError
      );
    }

    return NextResponse.json({
      success: true,
      cliente,
      enderecos,
      fidelidade: fidelidade ?? null,
    });

  } catch (e) {
    console.error(e);

    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}