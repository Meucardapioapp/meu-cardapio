import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { PLANOS, type PlanoId } from "@/lib/planos";
import { pagarme } from "@/lib/server/pagarme";

/**
 * Planos recorrentes na Pagar.me. Criados automaticamente na primeira
 * assinatura e guardados na tabela `planos_pagarme` (ou na variável
 * PAGARME_PLANO_MENSAL_ID, se preferir fixar).
 */
export async function getPlanoPagarmeId(plano: PlanoId) {
  const daEnv = process.env.PAGARME_PLANO_MENSAL_ID;

  if (daEnv) return daEnv;

  const { data } = await supabaseAdmin
    .from("planos_pagarme")
    .select("pagarme_plan_id, preco_centavos")
    .eq("plano", plano)
    .maybeSingle();

  const precoCentavos = Math.round(PLANOS[plano].preco * 100);

  // Se o preço mudar no código, cria um plano novo na Pagar.me.
  if (data?.pagarme_plan_id && Number(data.preco_centavos) === precoCentavos) {
    return data.pagarme_plan_id as string;
  }

  const criado = await pagarme<any>("/plans", {
    method: "POST",
    body: {
      name: `MeuCardapioApp ${PLANOS[plano].nome}`,
      description: "Cardápio digital com pedidos online",
      currency: "BRL",
      interval: PLANOS[plano].intervalo,
      interval_count: 1,
      billing_type: "prepaid",
      payment_methods: ["credit_card"],
      installments: [1],
      statement_descriptor: "MEUCARDAPIO",
      items: [
        {
          name: PLANOS[plano].nome,
          quantity: 1,
          pricing_scheme: { scheme_type: "unit", price: precoCentavos },
        },
      ],
    },
  });

  await supabaseAdmin.from("planos_pagarme").upsert(
    {
      plano,
      pagarme_plan_id: criado.id,
      preco_centavos: precoCentavos,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "plano" }
  );

  return criado.id as string;
}
