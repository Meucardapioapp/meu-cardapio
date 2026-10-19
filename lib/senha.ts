/** Regras de senha do dono do restaurante (usadas no navegador e no servidor). */
export const REGRAS_SENHA = [
  { id: "tamanho", texto: "Pelo menos 8 caracteres", teste: (s: string) => s.length >= 8 },
  { id: "maiuscula", texto: "Uma letra maiúscula", teste: (s: string) => /[A-ZÀ-Ý]/.test(s) },
  { id: "minuscula", texto: "Uma letra minúscula", teste: (s: string) => /[a-zà-ý]/.test(s) },
  { id: "numero", texto: "Um número", teste: (s: string) => /\d/.test(s) },
  { id: "especial", texto: "Um caractere especial (!@#$%…)", teste: (s: string) => /[^A-Za-zÀ-ÿ0-9\s]/.test(s) },
] as const;

const COMUNS = ["12345678", "password", "senha123", "qwerty", "abcdefgh", "11111111", "meucardapio"];

export function senhaValida(senha: string) {
  return REGRAS_SENHA.every((r) => r.teste(senha)) && senha.length <= 72;
}

/** 0 = fraca, 1 = média, 2 = forte */
export function forcaSenha(senha: string): 0 | 1 | 2 {
  if (!senha) return 0;
  const atendidas = REGRAS_SENHA.filter((r) => r.teste(senha)).length;
  const comum = COMUNS.some((c) => senha.toLowerCase().includes(c));
  if (comum || atendidas <= 3) return 0;
  if (atendidas === 5 && senha.length >= 12) return 2;
  if (atendidas === 5) return 1;
  return 1;
}
