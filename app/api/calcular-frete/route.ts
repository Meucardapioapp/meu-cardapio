import { limitar } from "@/lib/server/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  EnderecoNaoEncontradoError,
  ForaDaAreaError,
  freteKm,
  getConfigFrete,
} from "@/lib/server/frete";

function texto(v: unknown, max = 120) {
  return String(v ?? "").trim().slice(0, max);
}

/** Como o restaurante cobra a entrega (o checkout mostra lista de bairros ou campo livre). */
export async function GET(req: NextRequest) {
  if (!(await limitar(req, "calcular-frete", 60, 60))) {
    return NextResponse.json({ sucesso: false, erro: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
  }

  const restauranteId = texto(req.nextUrl.searchParams.get("restauranteId"), 64);
  if (!restauranteId) return NextResponse.json({ sucesso: false }, { status: 400 });

  const config = await getConfigFrete(restauranteId);
  return NextResponse.json({ sucesso: true, modo: config.modo });
}

export async function POST(req: Request) {
  try {
    // Cada busca por distância consulta o mapa: limite mais apertado.
    if (!(await limitar(req, "calcular-frete", 30, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const restauranteId = texto(body.restauranteId, 64);
    const bairro = texto(body.bairro);

    if (!restauranteId) {
      return NextResponse.json({ sucesso: false, erro: "Restaurante não informado." }, { status: 400 });
    }

    const config = await getConfigFrete(restauranteId);

    if (config.modo === "km") {
      try {
        const { km, valor } = await freteKm(restauranteId, config, {
          rua: texto(body.rua),
          numero: texto(body.numero, 20),
          bairro,
          cep: texto(body.cep, 12),
        });
        return NextResponse.json({ sucesso: true, faixaFrete: { valor, distanciaKm: km } });
      } catch (error) {
        if (error instanceof ForaDaAreaError) {
          return NextResponse.json({ sucesso: false, foraDaArea: true, erro: error.message }, { status: 400 });
        }
        if (error instanceof EnderecoNaoEncontradoError) {
          return NextResponse.json({ sucesso: false, erro: error.message }, { status: 400 });
        }
        throw error;
      }
    }

    const { data: bairroEntrega, error } = await supabaseAdmin
      .from("bairros_entrega")
      .select("valor")
      .eq("restaurante_id", restauranteId)
      .eq("bairro", bairro)
      .limit(1)
      .maybeSingle();

    if (error || !bairroEntrega) {
      return NextResponse.json({ sucesso: false, erro: "Este bairro não é atendido." }, { status: 400 });
    }

    return NextResponse.json({ sucesso: true, faixaFrete: { valor: Number(bairroEntrega.valor) } });
  } catch (error) {
    console.error("[calcular-frete]", error);
    return NextResponse.json(
      {
        sucesso: false,
        erro: error instanceof Error && error.message.startsWith("Não foi possível")
          ? error.message
          : "Erro ao calcular frete.",
      },
      { status: 500 }
    );
  }
}
