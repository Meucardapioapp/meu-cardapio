import { NextResponse } from "next/server";

// Importador de cardápio removido. Pode apagar esta pasta.
function desativada() {
  return NextResponse.json({ error: "Rota desativada." }, { status: 410 });
}

export const GET = desativada;
export const POST = desativada;
