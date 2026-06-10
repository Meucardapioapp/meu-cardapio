import Stripe from "stripe";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY as string
);

export async function GET() {
  return Response.json({
    status: "ok",
  });
}

export async function POST(req: Request) {
  try {
    let body;

try {
  body = await req.json();
} catch {
  return Response.json(
    {
      error: "Body inválido",
    },
    {
      status: 400,
    }
  );
}

const {
  total,
  telefone,
  restauranteStripeAccountId,
} = body;

    console.log(
      "restauranteStripeAccountId:",
      restauranteStripeAccountId
    );

    if (!total) {
      return Response.json(
        {
          error: "Total não informado",
        },
        {
          status: 400,
        }
      );
    }

    // Verifica se a conta Connect existe
    if (restauranteStripeAccountId) {
      try {
        const conta =
          await stripe.accounts.retrieve(
            restauranteStripeAccountId
          );

        console.log(
          "CONTA ENCONTRADA:",
          conta.id
        );
      } catch (erroConta) {
        console.error(
          "ERRO AO BUSCAR CONTA CONNECT:"
        );

        console.error(erroConta);

        return Response.json(
          {
            error:
              "Conta Stripe Connect não encontrada",
          },
          {
            status: 400,
          }
        );
      }
    }

    const taxaPlataforma = Math.round(
      total * 0.01 * 100
    );

   const session =
  await stripe.checkout.sessions.create({

    payment_method_types: [
      "card",
      "pix",
    ],

    billing_address_collection:
      "auto",

    line_items: [
      {
        price_data: {
          currency: "brl",

          product_data: {
            name: "Pedido MeuCardápio",
          },

          unit_amount:
            Math.round(
              total * 100
            ),
        },

        quantity: 1,
      },
    ],

    mode: "payment",

    success_url:
      "http://localhost:3000/sucesso?session_id={CHECKOUT_SESSION_ID}",

    cancel_url:
      "http://localhost:3000/cancelado",

    ...(restauranteStripeAccountId && {
      payment_intent_data: {
        application_fee_amount:
          taxaPlataforma,

        transfer_data: {
          destination:
            restauranteStripeAccountId,
        },
      },
    }),
  });

    return Response.json({
      url: session.url,
    });
  } catch (error) {
    console.error(
      "ERRO AO CRIAR CHECKOUT:"
    );

    console.error(error);

    return Response.json(
      {
        error:
          "Erro ao criar checkout",
      },
      {
        status: 500,
      }
    );
  }
}