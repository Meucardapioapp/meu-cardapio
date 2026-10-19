/**
 * Dados públicos do restaurante (cardápio, SEO, checkout).
 *
 * Lê pela vista "restaurantes_publico", que NÃO tem e-mail, nome do
 * responsável, telefone pessoal nem nada interno. A tabela completa só
 * é lida pelo dono logado (a própria linha) ou pelo servidor.
 *
 * Enquanto o SQL 05 não for rodado a vista ainda não existe: aí lê da
 * tabela antiga, para o cardápio não sair do ar no meio da atualização.
 */
type Resultado = { data: any; error: { code?: string; message?: string } | null };

export async function lerRestaurantePublico(
  consulta: (tabela: string) => PromiseLike<any>
): Promise<Resultado> {
  const resultado: Resultado = await consulta("restaurantes_publico");

  const vistaNaoExiste =
    resultado.error &&
    (resultado.error.code === "PGRST205" ||
      resultado.error.code === "42P01" ||
      /restaurantes_publico/.test(resultado.error.message ?? ""));

  if (vistaNaoExiste) return consulta("restaurantes");

  return resultado;
}
