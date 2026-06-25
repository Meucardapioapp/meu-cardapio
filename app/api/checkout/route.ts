import { NextRequest, NextResponse } from "next/server";
import { createPixOrder } from "@/lib/payment/orders";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      customer,
      items,
      pedidoId,
    } = body;

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          message: "Cliente não informado.",
        },
        {
          status: 400,
        }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Pedido sem itens.",
        },
        {
          status: 400,
        }
      );
    }

    const order = await createPixOrder({
      customer,
      items,
    });

    const charge =
      order?.charges?.[0];

    const transaction =
      charge?.last_transaction;

    return NextResponse.json({
      success: true,

      pedidoId,

      pagarmeOrderId: order.id,

      chargeId: charge?.id,

      qrCode: transaction?.qr_code,

      copiaECola:
        transaction?.qr_code,

      qrCodeUrl:
        transaction?.qr_code_url,

      expiresAt:
        transaction?.expires_at,

      status:
        charge?.status,
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Erro ao criar pagamento.",
      },
      {
        status: 500,
      }
    );
  }
}