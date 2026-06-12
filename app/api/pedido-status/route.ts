import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  request: Request
) {
  const { searchParams } =
    new URL(request.url);

  const id =
    searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 400,
      }
    );
  }

  const { data } =
    await supabaseAdmin
      .from("pedidos")
      .select(
        "payment_status"
      )
      .eq("id", id)
      .single();

  return NextResponse.json({
    success: true,
    payment_status:
      data?.payment_status ||
      "pending",
  });
}