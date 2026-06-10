import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const code = searchParams.get("code");
    const restauranteId = searchParams.get("state");

    if (!code) {
      return NextResponse.json(
        {
          error: "Código OAuth não recebido",
        },
        {
          status: 400,
        }
      );
    }

    if (!restauranteId) {
      return NextResponse.json(
        {
          error: "Restaurante não informado",
        },
        {
          status: 400,
        }
      );
    }

    const response = await fetch(
      "https://api.mercadopago.com/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          client_id:
            process.env.MERCADOPAGO_CLIENT_ID,
          client_secret:
            process.env.MERCADOPAGO_CLIENT_SECRET,
          code,
          redirect_uri:
            process.env.MERCADOPAGO_REDIRECT_URI,
        }),
      }
    );

    const data = await response.json();

    console.log(
      "MERCADO PAGO RESPONSE:",
      data
    );

    if (!data.access_token) {
      return NextResponse.json(
        {
          error:
            "Access Token não retornado",
          mercadoPagoResponse: data,
        },
        {
          status: 500,
        }
      );
    }

    const { error } =
      await supabaseAdmin
        .from("restaurantes")
        .update({
          mercadopago_access_token:
            data.access_token,

          mercadopago_user_id:
            String(data.user_id),

          mercadopago_refresh_token:
            data.refresh_token,

          mercadopago_connected:
            true,

          mercadopago_connected_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          restauranteId
        );

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          error:
            "Erro ao salvar conexão",
          details: error,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/admin/mercado-pago?success=true`
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Erro ao finalizar OAuth",
      },
      {
        status: 500,
      }
    );
  }
}