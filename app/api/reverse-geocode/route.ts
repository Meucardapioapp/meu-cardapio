import { NextResponse } from "next/server";

// Rota desativada por segurança (removida na atualização de 12/10/2026).
// Pode apagar esta pasta.
function desativada() {
  return NextResponse.json({ error: "Rota desativada." }, { status: 410 });
}

export const GET = desativada;
export const POST = desativada;
export const PUT = desativada;
export const PATCH = desativada;
export const DELETE = desativada;
