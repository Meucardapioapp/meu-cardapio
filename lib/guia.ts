/** Ordem do guia que pisca no menu até o dono abrir cada área. */
export const PASSOS_GUIA = [
  { id: "aparencia", link: "/admin/aparencia", nome: "Editar Cardápio", dica: "Coloque sua logo, banner, cores e horários." },
  { id: "produtos", link: "/admin/produtos", nome: "Editar Produtos", dica: "Cadastre os produtos e preços." },
  { id: "entrega", link: "/admin/entrega", nome: "Taxa de entrega", dica: "Diga os bairros que você atende e o valor." },
  { id: "pagamentos", link: "/admin/pagamentos", nome: "Formas de pagamento", dica: "Escolha como o cliente pode pagar." },
  { id: "retirada", link: "/admin/restaurante", nome: "Endereço para retirada", dica: "Informe onde o cliente retira o pedido." },
  { id: "dados-bancarios", link: "/admin/dados-bancarios", nome: "Dados bancários", dica: "Cadastre sua conta para receber Pix online." },
] as const;

export type PassoGuia = (typeof PASSOS_GUIA)[number]["id"];
