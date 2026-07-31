import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

async function buscarCoordenadas(
  endereco: string
) {
  const url =
    `https://nominatim.openstreetmap.org/search?` +
    `q=${encodeURIComponent(endereco)}` +
    `&format=json&limit=1`

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "MeuCardapioApp/1.0",
    },
  })

  const data = await response.json()

  if (!data.length) {
    return null
  }

   return {
    lat: Number(data[0].lat),
    lon: Number(data[0].lon),
  }
}

async function calcularDistancia(
  origemLat: number,
  origemLon: number,
  destinoLat: number,
  destinoLon: number
) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${origemLon},${origemLat};${destinoLon},${destinoLat}` +
    `?overview=false`

  const response = await fetch(url)

  const data = await response.json()

  if (!data.routes?.length) {
    return null
  }

  return data.routes[0].distance / 1000
}

export async function GET() {

  const restaurante =
    await buscarCoordenadas(
      "Rua São Feliciano, 91, Monte das Oliveiras, Manaus, AM"
    )

  const cliente =
    await buscarCoordenadas(
      "Avenida Margarita, Manaus, AM"
    )

  if (!restaurante || !cliente) {
    return NextResponse.json({
      erro: "Coordenadas não encontradas"
    })
  }

  const distancia =
    await calcularDistancia(
      restaurante.lat,
      restaurante.lon,
      cliente.lat,
      cliente.lon
    )

  return NextResponse.json({
    restaurante,
    cliente,
    distanciaKm: distancia
  })
}

export async function POST(req: Request) {
  try {
    const {
      restauranteId,
      rua,
      numero,
      bairro,
      cidade,
      estado,
       enderecoManual,
    } = await req.json()

    const { data: restaurante } =
      await supabaseAdmin
        .from("restaurantes")
        .select("*")
        .eq("id", restauranteId)
        .single()

    if (!restaurante) {
  return NextResponse.json(
    {
      erro: "Restaurante não encontrado",
    },
    { status: 404 }
  )
}

const { data: taxaEntrega } =
  await supabaseAdmin
    .from("taxas_entrega")
    .select("*")
    .eq("restaurante_id", restauranteId)
    .single()

if (!taxaEntrega) {
  return NextResponse.json(
    {
      erro: "Configuração de entrega não encontrada",
    },
    { status: 404 }
  )
}

if (enderecoManual) {
  return NextResponse.json({
    sucesso: true,
    distanciaKm: null,
    faixaFrete: {
      valor:
        taxaEntrega.tipo === "gratis"
          ? 0
          : Number(taxaEntrega.taxa_fixa),
    },
  })
}

const enderecoRestaurante = `
${restaurante.endereco},
${restaurante.numero},
${restaurante.bairro},
${restaurante.cidade},
${restaurante.estado}
`

const enderecoCliente = `
${rua},
${numero},
${bairro},
${cidade},
${estado}
`

const coordenadasRestaurante =
  await buscarCoordenadas(
    enderecoRestaurante
  )

const coordenadasCliente =
  await buscarCoordenadas(
    enderecoCliente
  )

  if (!coordenadasRestaurante || !coordenadasCliente) {
  return NextResponse.json(
    {
      erro: "Não foi possível localizar os endereços",
    },
    { status: 400 }
  )
}

const distanciaKm =
  await calcularDistancia(
    coordenadasRestaurante.lat,
    coordenadasRestaurante.lon,
    coordenadasCliente.lat,
    coordenadasCliente.lon
  )

console.log(
  "DISTÂNCIA:",
  distanciaKm
)


if (distanciaKm == null) {
  return NextResponse.json(
    {
      erro: "Não foi possível calcular a distância",
    },
    { status: 400 }
  )
}


if (
  taxaEntrega.tipo === "distancia" &&
  distanciaKm > Number(taxaEntrega.raio_maximo_km)
) {
  return NextResponse.json(
    {
      sucesso: false,
      foraDaArea: true,
      distanciaKm,
      raioMaximo: taxaEntrega.raio_maximo_km,
      erro: "Este endereço está fora da área de entrega.",
    },
    { status: 400 }
  )
}

if (taxaEntrega.tipo === "gratis") {
  return NextResponse.json({
    sucesso: true,
    distanciaKm: 0,
    faixaFrete: {
      valor: 0,
    },
  })
}

if (taxaEntrega.tipo === "fixa") {
  return NextResponse.json({
    sucesso: true,
    distanciaKm: 0,
    faixaFrete: {
      valor: taxaEntrega.taxa_fixa,
    },
  })
}

const { data: faixaFrete } =
  await supabaseAdmin
    .from("faixas_entrega")
    .select("*")
    .eq("taxas_entrega_id", taxaEntrega.id)
    .gte("distancia_km", distanciaKm)
    .order("distancia_km", { ascending: true })
    .limit(1)
    .single()

console.log(
  "FAIXA ENCONTRADA:",
  faixaFrete
)

console.log(
  "RESTAURANTE:",
  coordenadasRestaurante
)

console.log(
  "CLIENTE:",
  coordenadasCliente
)

   return NextResponse.json({
  sucesso: true,

  distanciaKm,
  faixaFrete,

  coordenadasRestaurante,
  coordenadasCliente,

  enderecoRestaurante: {
    rua: restaurante.endereco,
    numero: restaurante.numero,
    bairro: restaurante.bairro,
    cidade: restaurante.cidade,
    estado: restaurante.estado,
  },

  enderecoCliente: {
    rua,
    numero,
    bairro,
    cidade,
    estado,
     enderecoManual,
  },
})
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        erro: "Erro ao calcular frete",
      },
      { status: 500 }
    )
  }
}