import { z } from "zod";

/** Validação de entradas (tamanho, formato e tipo) usada pelas rotas. */

const texto = (max: number) => z.string().trim().min(1).max(max);
const textoOpcional = (max: number) => z.string().trim().max(max).optional().default("");

export const esquemaCadastro = z.object({
  // Nome e sobrenome, até 30 letras (limite da Pagar.me para o recebedor).
  nomeResponsavel: z
    .string()
    .trim()
    .max(30, "Seu nome pode ter no máximo 30 letras. Use só nome e sobrenome.")
    .refine((v) => v.split(/\s+/).filter(Boolean).length >= 2, "Informe seu nome e sobrenome."),
  nomeRestaurante: texto(120),
  telefone: z.string().trim().regex(/^[\d\s()+-]{10,20}$/),
  whatsapp: z.string().trim().regex(/^[\d\s()+-]{10,20}$/),
  cidade: texto(120),
  estado: textoOpcional(60),
  uf: z.string().trim().max(2).optional().default(""),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(60),
  categoria: textoOpcional(60),
  email: z.string().trim().toLowerCase().email().max(254),
  senha: z.string().min(8).max(72),
});

export const esquemaEndereco = z.object({
  token: z.string().min(10).max(200),
  id: z.union([z.string(), z.number()]).optional(),
  apelido: textoOpcional(40),
  cep: textoOpcional(12),
  rua: textoOpcional(160),
  numero: textoOpcional(20),
  bairro: textoOpcional(120),
  cidade: textoOpcional(120),
  estado: textoOpcional(60),
  complemento: textoOpcional(120),
  referencia: textoOpcional(160),
  principal: z.boolean().optional().default(false),
});

export const esquemaPerfilCliente = z.object({
  token: z.string().min(10).max(200),
  nome: texto(120),
  telefone: z.string().trim().regex(/^[\d\s()+-]{10,20}$/),
  cpf: z.string().trim().max(14).optional().default(""),
});

export function primeiroErro(e: z.ZodError) {
  const problema = e.issues[0];
  // Mensagens escritas por nós (em português) vão direto para a tela.
  if (problema?.code === "custom" || /letras|nome/i.test(problema?.message ?? "")) {
    return problema.message;
  }
  const campo = problema?.path?.join(".") || "dados";
  return `Confira o campo "${campo}".`;
}
