import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno, getDonoAutenticado, naoAutenticado } from "@/lib/server/auth";

const digitos = (v: unknown) => String(v ?? "").replace(/\D/g, "");

/**
 * Clientes do restaurante logado. Pedidos e total gasto contam TODAS as
 * formas de pagamento (Pix pago, dinheiro e cartão), sem recusados/cancelados.
 */
export async function GET(req: NextRequest) {
  try {
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    const id = dono.restaurante.id;

    const [{ data: clientes, error }, { data: pedidos }, { data: selos }] = await Promise.all([
      supabaseAdmin
        .from("clientes")
        .select("id, nome, telefone, created_at")
        .eq("restaurante_id", id)
        .order("nome")
        .limit(5000),
      supabaseAdmin
        .from("pedidos")
        .select("cliente_id, telefone, total, created_at, status, payment_method, payment_status")
        .eq("restaurante_id", id)
        .order("created_at", { ascending: false })
        .limit(50000),
      supabaseAdmin
        .from("cliente_fidelidade")
        .select("cliente_id, selos")
        .eq("restaurante_id", id),
    ]);

    if (error) throw error;

    const porCliente = new Map<string, { pedidos: number; gasto: number; ultimo: string | null }>();
    const idPorTelefone = new Map<string, string>();

    for (const c of clientes ?? []) {
      porCliente.set(String(c.id), { pedidos: 0, gasto: 0, ultimo: null });
      const tel = digitos(c.telefone);
      if (tel) idPorTelefone.set(tel, String(c.id));
    }

    for (const p of pedidos ?? []) {
      if (["recusado", "cancelado"].includes(String(p.status))) continue;
      if (p.payment_method === "pix" && p.payment_status !== "approved") continue;

      const clienteId = p.cliente_id ? String(p.cliente_id) : idPorTelefone.get(digitos(p.telefone));
      const linha = clienteId ? porCliente.get(clienteId) : undefined;
      if (!linha) continue;

      linha.pedidos += 1;
      linha.gasto += Number(p.total || 0);
      if (!linha.ultimo) linha.ultimo = p.created_at;
    }

    const selosPorCliente = new Map((selos ?? []).map((s) => [String(s.cliente_id), Number(s.selos || 0)]));

    return NextResponse.json({
      success: true,
      clientes: (clientes ?? []).map((c) => {
        const linha = porCliente.get(String(c.id))!;
        return {
          id: c.id,
          nome: c.nome,
          telefone: c.telefone,
          pedidos: linha.pedidos,
          total_gasto: Math.round(linha.gasto * 100) / 100,
          ultimo_pedido: linha.ultimo,
          selos: selosPorCliente.get(String(c.id)) ?? 0,
        };
      }),
    });
  } catch (error) {
    return erroInterno("painel/clientes", error);
  }
}
