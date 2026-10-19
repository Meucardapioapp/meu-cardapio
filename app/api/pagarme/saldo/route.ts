import { NextRequest, NextResponse } from "next/server";
import { erroInterno, getDonoAutenticado, naoAutenticado } from "@/lib/server/auth";
import { getRecebedorId } from "@/lib/server/recebedor";
import { pagarme } from "@/lib/server/pagarme";

export async function GET(req: NextRequest) {
  try {
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    const recipientId = await getRecebedorId(dono.restaurante.id);

    if (!recipientId) {
      return NextResponse.json(
        { success: false, error: "Cadastre seus dados bancários para receber pagamentos online." },
        { status: 400 }
      );
    }

    const balance = await pagarme<any>(`/recipients/${recipientId}/balance`);

    const saldoDisponivel = (balance.available_amount ?? 0) / 100;
    const saldoProcessando = Math.max(balance.waiting_funds_amount ?? 0, 0) / 100;

    return NextResponse.json({
      success: true,
      saldoTotal: saldoDisponivel + saldoProcessando,
      saldoDisponivel,
      saldoProcessando,
      saldoTransferido: (balance.transferred_amount ?? 0) / 100,
    });
  } catch (error) {
    return erroInterno("pagarme/saldo", error);
  }
}
