import "server-only";

/**
 * Traduz erros do banco em mensagens úteis.
 * Em desenvolvimento (localhost) mostra o detalhe técnico para facilitar o conserto;
 * em produção o cliente vê só uma mensagem genérica.
 */
export function mensagemDeErroBanco(error: unknown, generica: string) {
  const e = error as { code?: string; message?: string; details?: string; hint?: string };
  const codigo = e?.code ?? "";
  const texto = `${e?.message ?? ""} ${e?.details ?? ""}`;

  const bancoDesatualizado =
    codigo === "PGRST204" ||
    codigo === "42703" ||
    codigo === "42P01" ||
    codigo === "PGRST202" ||
    /column .* does not exist|Could not find the .* column|relation .* does not exist/i.test(texto);

  if (bancoDesatualizado) {
    return {
      status: 503,
      mensagem:
        "O banco de dados ainda não foi atualizado. Rode os arquivos SQL da pasta supabase/ no Supabase (veja LEIA-ME-ATUALIZACAO.md).",
    };
  }

  if (process.env.NODE_ENV !== "production") {
    return { status: 500, mensagem: `${generica} [detalhe: ${codigo} ${e?.message ?? String(error)}]` };
  }

  return { status: 500, mensagem: generica };
}
