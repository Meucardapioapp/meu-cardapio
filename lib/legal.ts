/**
 * Dados da empresa para os textos legais (Termos e Privacidade).
 * PREENCHA antes de publicar: razão social, CNPJ, endereço e e-mail do encarregado (LGPD, art. 41).
 * Campos vazios simplesmente não aparecem nas páginas.
 */
export const EMPRESA = {
  nome: "MeuCardápioApp",
  razaoSocial: "67.583.816 VICTOR GABRIEL PORTELA MOURA",
  cnpj: "67.583.816/0001-66",
  endereco: "Manaus/AM",
  // E-mail para pedidos de privacidade (acesso, correção, exclusão de dados)
  emailPrivacidade: "contatomeucardapio@gmail.com",
  cidadeForo: "Manaus/AM",
  // WhatsApp do suporte (o mesmo do painel)
  whatsappSuporte: "5592992338863",
};

/** Muda esta data quando os Termos ou a Privacidade mudarem: os donos aceitam de novo no painel. */
export const TERMOS_VERSAO = "2026-10-20";
