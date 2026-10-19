import { limitar } from "@/lib/server/rate-limit";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
    if (!(await limitar(request, "pedido-status", 120, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const codigo = searchParams.get("c");

  if (!id || !codigo) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const { data } = await supabaseAdmin
    .from("pedidos")
    .select("payment_status, status")
    .eq("id", id)
    .eq("codigo_acesso", codigo)
    .maybeSingle();

  return NextResponse.json({
    success: Boolean(data),
    payment_status: data?.payment_status || "pending",
    status: data?.status || null,
  });
}
