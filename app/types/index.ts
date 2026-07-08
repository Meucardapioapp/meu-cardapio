export interface Adicional {
  nome: string
  preco: number
}

export interface GrupoObrigatorioOpcao {
  id: string

  nome: string

  preco: number

  imagem?: string

  ordem?: number
}

export interface GrupoObrigatorio {
  id: string

  nome: string

  minimo: number

  maximo: number

  ordem?: number

  grupo_obrigatorio_opcoes: GrupoObrigatorioOpcao[]
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

  gruposObrigatorios?: GrupoObrigatorio[]
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