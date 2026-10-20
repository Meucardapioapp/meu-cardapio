import { limitar } from "@/lib/server/rate-limit";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { confirmarPedidoPagarme } from "@/lib/server/pix-confirmacao";

// Cada pedido consulta a Pagar.me no máximo a cada 10 s (a tela pergunta a cada 3 s).
const ultimaConsulta = new Map<string, number>();

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

  const buscar = () =>
    supabaseAdmin
      .from("pedidos")
      .select("payment_status, status, payment_method, pagarme_order_id, created_at")
      .eq("id", id)
      .eq("codigo_acesso", codigo)
      .maybeSingle();

  let { data } = await buscar();

  // Pix ainda pendente: confere direto na Pagar.me (não depende só do webhook).
  if (
    data &&
    data.payment_method === "pix" &&
    data.payment_status !== "approved" &&
    data.pagarme_order_id &&
    Date.now() - new Date(String(data.created_at)).getTime() < 3 * 3600 * 1000
  ) {
    const chave = String(data.pagarme_order_id);
    const antes = ultimaConsulta.get(chave) ?? 0;
    if (Date.now() - antes > 10_000) {
      ultimaConsulta.set(chave, Date.now());
      if (ultimaConsulta.size > 5000) ultimaConsulta.delete(ultimaConsulta.keys().next().value as string);
      try {
        await confirmarPedidoPagarme(chave);
        ({ data } = await buscar());
      } catch (e: any) {
        console.error("[pedido-status] conferir pix", e?.message ?? e);
      }
    }
  }

  return NextResponse.json({
    success: Boolean(data),
    payment_status: data?.payment_status || "pending",
    status: data?.status || null,
  });
}
