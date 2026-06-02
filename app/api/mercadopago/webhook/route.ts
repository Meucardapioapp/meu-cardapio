import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    console.log("WEBHOOK MP:")
    console.log(body)

    return NextResponse.json({
      success: true,
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