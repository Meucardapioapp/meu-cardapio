import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      {
        success: false,
        error: "ID não informado",
      },
      {
        status: 400,
      }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("pedidos")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      {
        success: false,
        error: "Pedido não encontrado",
      },
      {
        status: 404,
      }
    );
  }

  const { data: restaurante } = await supabaseAdmin
  .from("restaurantes")
  .select("whatsapp")
  .eq("id", data.restaurante_id)
  .single();

return NextResponse.json({
  success: true,

  pedido: {
    ...data,
    telefone_restaurante:
      restaurante?.whatsapp || "",
  },
});
}