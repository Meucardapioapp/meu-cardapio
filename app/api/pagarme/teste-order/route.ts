import { NextResponse } from "next/server";
import { createPixOrder } from "@/lib/payment/orders";

export async function GET() {
  try {
    const order = await createPixOrder({
      customer: {
        name: "Victor Gabriel Portela Moura",
        email: "vitor-portela.moura@hotmail.com",
        document: "03066426203",
        phone: "92992338863",
      },

      items: [
        {
          name: "Pizza Teste",
          quantity: 1,
          amount: 100,
        },
      ],
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Erro ao criar pedido.",
      },
      {
        status: 500,
      }
    );
  }
}