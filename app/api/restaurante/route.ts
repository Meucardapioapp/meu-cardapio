import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const restauranteId = searchParams.get("id");

    if (!restauranteId) {
      return NextResponse.json(
        {
          success: false,
          error: "ID do restaurante não informado",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("restaurantes")
      .select("*")
      .eq("id", restauranteId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          success: false,
          error: "Restaurante não encontrado",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      restaurante: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}