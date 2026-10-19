import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { limitar } from "@/lib/server/rate-limit";

/** Avaliação do pedido pelo cliente (só quem tem o código do pedido). */

const STATUS_AVALIAVEIS = ["entrega", "concluido"];

async function buscarPedido(id: unknown, codigo: unknown) {
  const pid = String(id ?? "").slice(0, 64);
  const cod = String(codigo ?? "").slice(0, 100);
  if (!pid || !cod) return null;

  const { data } = await supabaseAdmin
    .from("pedidos")
    .select("id, restaurante_id, status, nome, cliente")
    .eq("id", pid)
    .eq("codigo_acesso", cod)
    .maybeSingle();
  return data;
}

export async function GET(request: Request) {
  if (!(await limitar(request, "avaliacao-ver", 60, 60))) {
    return NextResponse.json({ avaliado: true }, { status: 429 });
  }
  const { searchParams } = new URL(request.url);
  const pedido = await buscarPedido(searchParams.get("id"), searchParams.get("c"));
  if (!pedido) return NextResponse.json({ avaliado: true });

  const { data, error } = await supabaseAdmin
    .from("avaliacoes")
    .select("id")
    .eq("pedido_id", String(pedido.id))
    .maybeSingle();

  // Sem a tabela (SQL 08 ainda não rodou): não mostra o quadro.
  if (error) return NextResponse.json({ avaliado: true });
  return NextResponse.json({ avaliado: Boolean(data) });
}

export async function POST(request: Request) {
  try {
    if (!(await limitar(request, "avaliacao-enviar", 10, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }
    const body = await request.json().catch(() => ({}));
    const nota = Number(body?.nota);
    if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
      return NextResponse.json({ success: false, error: "Escolha de 1 a 5 estrelas." }, { status: 400 });
    }
    const comentario = String(body?.comentario ?? "").replace(/\s+/g, " ").trim().slice(0, 300);

    const pedido = await buscarPedido(body?.id, body?.c);
    if (!pedido) return NextResponse.json({ success: false, error: "Pedido não encontrado." }, { status: 404 });
    if (!STATUS_AVALIAVEIS.includes(String(pedido.status))) {
      return NextResponse.json({ success: false, error: "Você pode avaliar quando o pedido sair." }, { status: 400 });
    }

    const nome = String(pedido.nome || pedido.cliente || "").trim().split(" ")[0].slice(0, 40) || null;

    const { error } = await supabaseAdmin.from("avaliacoes").insert({
      restaurante_id: pedido.restaurante_id,
      pedido_id: String(pedido.id),
      nota,
      comentario: comentario || null,
      nome,
    });

    if (error) {
      if (error.code === "23505") return NextResponse.json({ success: true });
      console.error("avaliacao POST", error.message);
      return NextResponse.json({ success: false, error: "Não foi possível salvar agora." }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("avaliacao POST", e);
    return NextResponse.json({ success: false, error: "Não foi possível salvar agora." }, { status: 500 });
  }
}
