import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {

  // Busca todos os estados cadastrados
  const { data: estados } = await supabaseAdmin
    .from("estados")
    .select("*");

  if (!estados) {
    return NextResponse.json({
      erro: "Nenhum estado encontrado.",
    });
  }

  let total = 0;

  for (const estado of estados) {

    const response = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado.uf}/municipios`
    );

    const cidades = await response.json();

    const registros = cidades.map((cidade: any) => ({
      nome: cidade.nome,
      ibge: cidade.id,
      estado_id: estado.id,
    }));

    await supabaseAdmin
      .from("cidades")
      .insert(registros);

    total += registros.length;
  }

  return NextResponse.json({
    sucesso: true,
    cidadesImportadas: total,
  });

}