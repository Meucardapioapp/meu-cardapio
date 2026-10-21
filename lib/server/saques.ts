import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { pagarme } from "@/lib/server/pagarme";

/** Situação final: não precisa perguntar de novo à Pagar.me. */
const FINAIS = new Set(["transferred", "paid", "failed", "canceled", "cancelled"]);
const ID_VALIDO = /^[a-z]{2,5}_[A-Za-z0-9]{6,64}$/;

/** Data em que o dinheiro foi transferido (quando a Pagar.me informa). */
function dataPagamento(t: any): string | null {
  const status = String(t?.status || "");
  if (status !== "transferred" && status !== "paid") return null;
  const d = t?.funding_date || t?.transfer_date || t?.date_transferred || t?.updated_at || null;
  return d ? new Date(d).toISOString() : new Date().toISOString();
}

async function gravar(saqueId: string, status: string, pagoEm: string | null) {
  const dados: Record<string, unknown> = { status };
  if (pagoEm) dados.pago_em = pagoEm;
  const { error } = await supabaseAdmin.from("saques").update(dados).eq("id", saqueId);
  // Tabela antiga sem a coluna pago_em: grava só o status.
  if (error && pagoEm) await supabaseAdmin.from("saques").update({ status }).eq("id", saqueId);
}

/**
 * Atualiza o status dos saques com o que está na Pagar.me.
 * Pergunta saque por saque (GET /transfers/:id) e, se não achar, procura na
 * lista de transferências do recebedor. Devolve a lista já atualizada.
 */
export async function sincronizarSaques(saques: any[], recipientId: string | null) {
  const pendentes = saques
    .filter((s) => s.pagarme_withdrawal_id && ID_VALIDO.test(String(s.pagarme_withdrawal_id)))
    .filter((s) => !FINAIS.has(String(s.status)) || !s.pago_em)
    .slice(0, 30);
  if (!pendentes.length) return saques;

  let lista: Promise<any[]> | null = null;
  async function daLista(id: string) {
    if (!recipientId) return null;
    lista ??= pagarme<any>(`/recipients/${recipientId}/transfers?size=100`)
      .then((r) => (Array.isArray(r) ? r : r?.data ?? []))
      .catch(() => []);
    return (await lista).find((x: any) => x?.id === id) ?? null;
  }

  await Promise.all(
    pendentes.map(async (s) => {
      const id = String(s.pagarme_withdrawal_id);
      let t: any = null;
      try {
        t = await pagarme<any>(`/transfers/${id}`);
      } catch {
        t = await daLista(id);
      }
      if (!t?.status) return;
      // Garante que é deste restaurante.
      const rec = t?.recipient?.id ?? t?.recipient_id ?? t?.target?.id;
      if (recipientId && rec && rec !== recipientId && rec !== s.pagarme_recipient_id) return;

      const pagoEm = dataPagamento(t);
      if (t.status !== s.status || (pagoEm && !s.pago_em)) {
        await gravar(String(s.id), String(t.status), pagoEm);
        s.status = t.status;
        if (pagoEm) s.pago_em = pagoEm;
      }
    })
  );

  return saques;
}

/** Webhook "transfer.*": atualiza só o saque daquele ID. */
export async function sincronizarSaquePorId(transferId: string) {
  const { data } = await supabaseAdmin.from("saques").select("*").eq("pagarme_withdrawal_id", transferId).limit(1);
  if (!data?.length) return;
  await sincronizarSaques(data, data[0].pagarme_recipient_id ?? null);
}
