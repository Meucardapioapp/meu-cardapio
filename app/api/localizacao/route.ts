import { NextResponse } from "next/server";
import { limitar } from "@/lib/server/rate-limit";
import { enderecoPorPonto } from "@/lib/server/frete";

/**
 * "Usar minha localização" no checkout: transforma a localização do celular
 * em rua/bairro/CEP. Não guarda a localização em lugar nenhum.
 */
export async function POST(req: Request) {
  if (!(await limitar(req, "localizacao", 6, 600))) {
    return NextResponse.json({ success: false, error: "Muitas tentativas. Digite o endereço." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const lat = Number(body?.lat);
  const lon = Number(body?.lon);
  // Só Brasil (com folga).
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -35 || lat > 6 || lon < -75 || lon > -28) {
    return NextResponse.json({ success: false, error: "Localização inválida." }, { status: 400 });
  }

  try {
    const endereco = await enderecoPorPonto(lat, lon);
    if (!endereco.rua && !endereco.bairro) {
      return NextResponse.json({ success: false, error: "Não achamos seu endereço. Digite abaixo." }, { status: 404 });
    }
    return NextResponse.json({ success: true, endereco });
  } catch (e: any) {
    console.error("[localizacao]", e?.message ?? e);
    return NextResponse.json({ success: false, error: "Não foi possível usar a localização agora. Digite o endereço." }, { status: 502 });
  }
}
