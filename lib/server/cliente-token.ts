import "server-only";

/**
 * Token do cliente final. Vem no cabeçalho "x-cliente-token" (não fica
 * gravado em logs de acesso como acontece com ?token= na URL).
 * Ainda aceita ?token= para aparelhos com a versão antiga aberta.
 */
export function tokenDoCliente(req: Request) {
  const doCabecalho = req.headers.get("x-cliente-token");
  const daUrl = new URL(req.url).searchParams.get("token");
  const token = String(doCabecalho || daUrl || "").trim();

  // Só letras, números e hífen: qualquer outra coisa é descartada.
  return /^[A-Za-z0-9_-]{16,128}$/.test(token) ? token : "";
}
