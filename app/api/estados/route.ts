import { NextResponse } from "next/server";

export async function GET() {

  const response = await fetch(
    "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome"
  );

  const estados = await response.json();

  return NextResponse.json(estados);

}