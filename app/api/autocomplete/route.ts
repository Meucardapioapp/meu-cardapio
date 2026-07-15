import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {

const search = req.nextUrl.searchParams.get("search");
const cidade = req.nextUrl.searchParams.get("cidade");
const estado = req.nextUrl.searchParams.get("estado");

  if (!search) {
    return NextResponse.json([]);
  }

const url =
  `https://api.geoapify.com/v1/geocode/autocomplete?` +
  `text=${encodeURIComponent(search)}` +
  `&lang=pt` +
  `&limit=10` +
  `&filter=countrycode:br` +
  `&bias=countrycode:br` +
  `&apiKey=${process.env.GEOAPIFY_API_KEY}`;

const response = await fetch(url);

const data = await response.json();

let resultados = data.features || [];

if (cidade && estado) {

  resultados = resultados.filter((item: any) => {

    const p = item.properties;

    return (

      p.city?.toLowerCase() ===
      cidade.toLowerCase()

      &&

      (

        p.state?.toLowerCase() ===
        estado.toLowerCase()

        ||

        p.state_code?.toLowerCase() ===
        estado.toLowerCase()

      )

    );

  });

}

return NextResponse.json(resultados);

}