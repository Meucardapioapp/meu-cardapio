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
  const dados = await getDadosFinanceiros(restauranteId).catch((e) => {
    console.error("[recebedor] falha ao ler restaurantes_financeiro", e?.message ?? e);
    return null;
  });
  const novo = dados?.pagarme_recipient_id || null;

  // A versão antiga do painel gravava o recebedor na tabela restaurantes.
  // Se lá existir um recebedor diferente (mais recente), ele vale e é copiado
  // para a tabela protegida.
  const antigo = await recebedorDaVersaoAntiga(restauranteId);
  if (antigo && antigo !== novo) {
    salvarDadosFinanceiros(restauranteId, { pagarme_recipient_id: antigo }).catch((e) =>
      console.error("[recebedor] falha ao copiar recebedor da versão antiga", e?.message ?? e)
    );
    return antigo;
  }

  return novo;
}

async function recebedorDaVersaoAntiga(restauranteId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("restaurantes")
      .select("pagarme_recipient_id")
      .eq("id", restauranteId)
      .maybeSingle();
    if (error || !data) return null; // coluna já removida: ok
    const id = String((data as any).pagarme_recipient_id || "").trim();
    return /^re_[A-Za-z0-9]+$/.test(id) ? id : null;
  } catch {
    return null;
  }
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
