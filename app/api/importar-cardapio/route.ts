import { NextResponse } from "next/server";
import { detectarPlataforma } from "@/lib/detectarPlataforma";
import { importarIfood } from "@/lib/importadores/ifood";
import { importarCardapioWeb } from "@/lib/importadores/cardapioweb";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const url = body.url;

    if (!url) {
      return NextResponse.json({
        success: false,
        message: "Nenhum link informado.",
      });
    }

    const plataforma = detectarPlataforma(url);

    if (!plataforma) {
      return NextResponse.json({
        success: false,
        message: "Plataforma não suportada.",
      });
    }

    console.log("Plataforma:", plataforma);
    console.log("Link recebido:", url);

    let resultado;

    switch (plataforma) {
      case "ifood":
        resultado = await importarIfood(url);
        break;

      case "cardapioweb":
        resultado = await importarCardapioWeb(url);
        break;

      default:
        return NextResponse.json({
          success: false,
          message: "Importador não encontrado.",
        });
    }

    console.log(resultado);

    return NextResponse.json({
      success: true,
      dados: resultado,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      message: "Erro interno.",
    });
  }
}