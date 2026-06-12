import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {

    const body = await request.json();

    const {
      pedidoId,
      restauranteId,
      total,
      token,
      issuerId,
      paymentMethodId,
      installments,
      email,
      cpf,
    } = body;

    const {
      data: restaurante,
      error: restauranteError,
    } = await supabaseAdmin
      .from("restaurantes")
      .select("*")
      .eq("id", restauranteId)
      .single();

    if (restauranteError || !restaurante) {
      throw new Error(
        "Restaurante não encontrado"
      );
    }

    const client =
      new MercadoPagoConfig({
        accessToken:
          restaurante.mercadopago_access_token,
      });

    const payment =
      new Payment(client);

    const valorFinal =
      Number(total);

    const resultado =
      await payment.create({
        body: {

          transaction_amount:
            valorFinal,

          token,

          installments,

          payment_method_id:
            paymentMethodId,

          issuer_id:
            issuerId,

          application_fee:
            Number(
              (
                valorFinal * 0.01
              ).toFixed(2)
            ),

          payer: {
            email,
            identification: {
              type: "CPF",
              number: cpf,
            },
          },

          description:
            "Pedido MeuCardapio",
        },
      });

    await supabaseAdmin
      .from("pedidos")
      .update({
        mercadopago_payment_id:
          String(resultado.id),

        payment_method:
          "cartao",

        payment_status:
          resultado.status,
      })
      .eq("id", pedidoId);

    return NextResponse.json({
      success: true,
      payment: resultado,
    });

  } catch (error: any) {

    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Erro ao processar cartão",
      },
      {
        status: 500,
      }
    );
  }
}