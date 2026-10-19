import { NextRequest, NextResponse } from "next/server";
import { carregarCardapio } from "@/lib/server/cardapio";
import { limitar } from "@/lib/server/rate-limit";

/** Cardápio público completo em uma só chamada (reserva quando a página não trouxe os dados). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await limitar(req, "cardapio", 120, 60))) {
    return NextResponse.json({ success: false, error: "Muitas tentativas." }, { status: 429 });
  }

  const { slug } = await params;
  const cardapio = await carregarCardapio(slug);

  if (!cardapio) {
    return NextResponse.json({ success: false, error: "Cardápio não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ success: true, cardapio });
}
