import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {

  const search = req.nextUrl.searchParams.get("search");

  if (!search) {
    return NextResponse.json([]);
  }

  const response = await fetch(

    `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
      search
    )}&lang=pt&limit=5&apiKey=${process.env.GEOAPIFY_API_KEY}`

  );

  const data = await response.json();

  return NextResponse.json(data.features || []);

}