export interface Adicional {
  nome: string
  preco: number
}

export interface ProdutoFormatado {
  id: string
  nome: string
  descricao: string
  imagem: string
  preco: number
  precoAntigo?: number
  categoria?: string
  promocao?: boolean
  adicionais?: Adicional[]
}

export interface CartItem extends ProdutoFormatado {
  uniqueId: string
  quantity: number
  observacao?: string
  adicionaisSelecionados?: Adicional[]
}

export interface Pedido {
  id: number

  cliente: string

  telefone: string

  bairro: string

  rua: string

  numero: string

  observacoes?: string

  pagamento: string

  status: string

  total: number

  itens: CartItem[]
}