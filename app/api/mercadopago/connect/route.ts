import { NextResponse } from "next/server";

export async function GET(
  request: Request
) {
  try {
    const { searchParams } = new URL(
      request.url
    );

    const restauranteId =
      searchParams.get(
        "restaurante_id"
      );

    if (!restauranteId) {
      return NextResponse.json(
        {
          error:
            "restaurante_id não informado",
        },
        {
          status: 400,
        }
      );
    }

    const clientId =
      process.env.MERCADOPAGO_CLIENT_ID;

    const redirectUri =
      process.env.MERCADOPAGO_REDIRECT_URI;

    console.log(
      "CLIENT_ID:",
      clientId
    );

    console.log(
      "REDIRECT_URI:",
      redirectUri
    );

    if (!clientId) {
      return NextResponse.json(
        {
          error:
            "MERCADOPAGO_CLIENT_ID não configurado",
        },
        {
          status: 500,
        }
      );
    }

    if (!redirectUri) {
      return NextResponse.json(
        {
          error:
            "MERCADOPAGO_REDIRECT_URI não configurado",
        },
        {
          status: 500,
        }
      );
    }

    const oauthUrl =
      `https://auth.mercadopago.com.br/authorization` +
      `?client_id=${clientId}` +
      `&response_type=code` +
      `&platform_id=mp` +
      `&state=${restauranteId}` +
      `&redirect_uri=${encodeURIComponent(
        redirectUri
      )}`;

    return NextResponse.redirect(
      oauthUrl
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Erro ao iniciar OAuth",
      },
      {
        status: 500,
      }
    );
  }
}