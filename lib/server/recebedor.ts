import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { criptografar, descriptografar } from "@/lib/server/cripto";

const CAMPOS_CRIPTOGRAFADOS = ["cpf_cnpj", "agencia", "conta", "digito_agencia", "digito_conta"] as const;

/**
 * Dados bancários e recebedor Pagar.me ficam na tabela
 * `restaurantes_financeiro`, que só o servidor consegue ler.
 */
export type DadosFinanceiros = {
  restaurante_id: string;
  cpf_cnpj: string | null;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  tipo_conta: string | null;
  digito_agencia: string | null;
  digito_conta: string | null;
  pagarme_recipient_id: string | null;
  pagarme_status: string | null;
};

export async function getDadosFinanceiros(
  restauranteId: string
): Promise<DadosFinanceiros | null> {
  const { data, error } = await supabaseAdmin
    .from("restaurantes_financeiro")
    .select("*")
    .eq("restaurante_id", restauranteId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const dados = { ...(data as DadosFinanceiros) };
  let precisaCriptografar = false;

  for (const campo of CAMPOS_CRIPTOGRAFADOS) {
    const valor = dados[campo];
    if (valor && !String(valor).startsWith("enc:v1:") && process.env.DADOS_CRIPTO_CHAVE) {
      precisaCriptografar = true;
    }
    dados[campo] = descriptografar(valor);
  }

  // Dado antigo ainda em texto puro: criptografa automaticamente na primeira leitura.
  if (precisaCriptografar) {
    const { restaurante_id: _id, ...resto } = dados;
    salvarDadosFinanceiros(restauranteId, resto).catch((e) =>
      console.error("[recebedor] falha ao criptografar dado antigo", e)
    );
  }

  return dados;
}

export async function getRecebedorId(restauranteId: string) {
  const dados = await getDadosFinanceiros(restauranteId);
  return dados?.pagarme_recipient_id || null;
}

export async function salvarDadosFinanceiros(
  restauranteId: string,
  dados: Partial<Omit<DadosFinanceiros, "restaurante_id">>
) {
  const protegidos: Record<string, unknown> = { ...dados };
  for (const campo of CAMPOS_CRIPTOGRAFADOS) {
    if (campo in protegidos) {
      protegidos[campo] = criptografar(protegidos[campo] as string | null);
    }
  }

  const { error } = await supabaseAdmin
    .from("restaurantes_financeiro")
    .upsert(
      {
        restaurante_id: restauranteId,
        ...protegidos,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "restaurante_id" }
    );

  if (error) throw error;
}

export function dadosBancariosCompletos(dados: DadosFinanceiros | null) {
  return Boolean(
    dados?.cpf_cnpj &&
      dados?.banco &&
      dados?.agencia &&
      dados?.conta &&
      dados?.tipo_conta
  );
}
