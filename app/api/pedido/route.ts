import { limitar } from "@/lib/server/rate-limit";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { pedidoPublico } from "@/lib/server/pedido";
import { pixChaveDoPedido } from "@/lib/server/pixChave";

/** Acompanhamento do pedido pelo cliente: exige o código do pedido. */
export async function GET(request: Request) {
    if (!(await limitar(request, "pedido-ver", 60, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const codigo = searchParams.get("c");

  if (!id || !codigo) {
    return NextResponse.json(
      { success: false, error: "Pedido não informado." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("pedidos")
    .select("*")
    .eq("id", id)
    .eq("codigo_acesso", codigo)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: "Pedido não encontrado." },
      { status: 404 }
    );
  }

  const aguardandoPixChave = data.payment_method === "pix_chave" && data.payment_status !== "approved";

  const [{ data: restaurante }, pixChave] = await Promise.all([
    supabaseAdmin.from("restaurantes").select("whatsapp").eq("id", data.restaurante_id).maybeSingle(),
    aguardandoPixChave ? pixChaveDoPedido(data).catch(() => null) : Promise.resolve(null),
  ]);

  return NextResponse.json({
    success: true,
    pedido: {
      ...pedidoPublico(data),
      telefone_restaurante: restaurante?.whatsapp || "",
      ...(pixChave ? { pix_chave: pixChave } : {}),
    },
  });
}
