import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search");

  if (!search) {
    return NextResponse.json([]);
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(search)}` +
      `&countrycodes=br` +
      `&format=jsonv2` +
      `&addressdetails=1` +
      `&limit=10`,
      {
        headers: {
          "User-Agent": "MeuCardapioApp/1.0"
        }
      }
    );

    const data = await response.json();

    const resultados = data.map((item: any) => ({
      properties: {
        formatted: item.display_name,
        street:
          item.address?.road ||
          item.address?.pedestrian ||
          "",
        suburb:
          item.address?.suburb ||
          item.address?.neighbourhood ||
          "",
        city:
          item.address?.city ||
          item.address?.town ||
          item.address?.village ||
          "",
        state_code: item.address?.state || "",
        lat: Number(item.lat),
        lon: Number(item.lon)
      }
    }));

    return NextResponse.json(resultados);

  } catch (error) {
    console.error(error);
    return NextResponse.json([]);
  }
}