import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const restauranteId =
      req.nextUrl.searchParams.get("restauranteId");

    if (!restauranteId) {
      return NextResponse.json(
        {
          success: false,
          error: "Restaurante não informado",
        },
        { status: 400 }
      );
    }

    const { data, error } =
      await supabaseAdmin
        .from("saques")
        .select("*")
        .eq("restaurante_id", restauranteId)
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      saques: data,
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