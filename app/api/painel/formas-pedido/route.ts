import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { erroInterno, getDonoAutenticado, naoAutenticado } from "@/lib/server/auth";
import { limitar } from "@/lib/server/rate-limit";
import { lerFormasPedido, mudarFormaPedido } from "@/lib/server/formasPedido";

/** Pix online ligado/desligado e "Só trabalho com delivery" do restaurante logado. */
export async function GET(req: NextRequest) {
  try {
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();
    const f = await lerFormasPedido(dono.restaurante.id);
    return NextResponse.json({ success: true, pix_online: f.pix_online, retirada: f.retirada });
  } catch (error) {
    return erroInterno("painel/formas-pedido GET", error);
  }
}

const esquema = z.object({ campo: z.enum(["pix_online", "retirada"]), ativo: z.boolean() });

export async function POST(req: NextRequest) {
  try {
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    if (!(await limitar(req, "painel-formas-pedido", 30, 60))) {
      return NextResponse.json({ success: false, error: "Muitas alterações seguidas. Aguarde um pouco." }, { status: 429 });
    }

    const lido = esquema.safeParse(await req.json().catch(() => null));
    if (!lido.success) return NextResponse.json({ success: false, error: "Opção inválida." }, { status: 400 });

    try {
      await mudarFormaPedido(dono.restaurante.id, lido.data.campo, lido.data.ativo);
    } catch (e: any) {
      if (String(e?.message || "").includes(lido.data.campo)) {
        return NextResponse.json(
          { success: false, error: "Falta atualizar o banco de dados (SQL 25). Fale com o suporte." },
          { status: 400 }
        );
      }
      throw e;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return erroInterno("painel/formas-pedido POST", error);
  }
}
