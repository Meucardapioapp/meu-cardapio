import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {

  const uf =
    req.nextUrl.searchParams.get("uf");

  const search =
    req.nextUrl.searchParams.get("search");

  if (!uf) {
    return NextResponse.json([]);
  }

  const response = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
  );

  const cidades = await response.json();

  if (!search) {
    return NextResponse.json(cidades);
  }

const textoBusca = search
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase();

const filtradas = cidades
  .filter((cidade: any) => {

    const nomeCidade = cidade.nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    return nomeCidade.includes(textoBusca);

  })
  .slice(0, 10);

  return NextResponse.json(filtradas);

}