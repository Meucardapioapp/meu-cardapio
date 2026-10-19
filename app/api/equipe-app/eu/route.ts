import { NextRequest, NextResponse } from "next/server";
import { erroInterno } from "@/lib/server/auth";
import { PAGINA_FUNCAO, getFuncionariosLogados } from "@/lib/server/funcionario";

/** Quem está logado neste celular (para mandar cada um para o seu app). */
export async function GET(req: NextRequest) {
  try {
    const todos = await getFuncionariosLogados(req);
    if (!todos) return NextResponse.json({ success: false, error: "Entre com seu celular e PIN." }, { status: 401 });
    return NextResponse.json({
      success: true,
      cadastros: todos.map((f) => ({
        id: f.id,
        nome: f.nome,
        funcao: f.funcao,
        setor: f.setor,
        restaurante: f.restaurante_nome,
        pagina: PAGINA_FUNCAO[f.funcao],
      })),
    });
  } catch (error) {
    return erroInterno("equipe-app/eu", error);
  }
}
