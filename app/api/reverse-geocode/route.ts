import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat");
  const lon = req.nextUrl.searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({});
  }

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`,
    {
      headers: {
        "User-Agent": "MeuCardapioApp/1.0",
      },
    }
  );

  const data = await response.json();

  return NextResponse.json({
    endereco:
      data.address?.road ||
      data.address?.pedestrian ||
      "",

    bairro:
      data.address?.suburb ||
      data.address?.neighbourhood ||
      "",

    cidade:
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      "",

    estado:
      data.address?.state || "",

    cep:
      data.address?.postcode || "",
  });
}