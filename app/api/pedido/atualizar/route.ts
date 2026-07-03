import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const {
      pedidoId,
      payment_status,
      payment_method,
      status,
    } = await req.json();

    const { data, error } = await supabaseAdmin
      .from("pedidos")
      .update({
        payment_status,
        payment_method,
        status,
      })
      .eq("id", pedidoId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      pedido: data,
    });

  } catch (error: any) {

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    );

  }
}