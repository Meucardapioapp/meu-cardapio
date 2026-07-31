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

    return NextResponse.json({
      success: true,
      cliente,
      enderecos,
    });

  } catch (e) {

    console.error(e);

    return NextResponse.json(
      { success: false },
      { status: 500 }
    );

  }
}