import { NextResponse } from "next/server"

export async function POST() {
  try {
    return NextResponse.json({
      url: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=50e4d62ea2e444688b206c5c395fda98",
    })
  } catch (error) {
    console.log(error)

    return NextResponse.json(
      {
        error: true,
      },
      {
        status: 500,
      }
    )
  }
}