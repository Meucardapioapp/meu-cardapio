-- =====================================================================
-- MeuCardapioApp: taxa de entrega por distância e Pix na chave do
-- restaurante (parte 9)
-- Só ACRESCENTA colunas: pode rodar agora, mesmo com a versão antiga no
-- ar. Pode rodar mais de uma vez. Rode depois do 08_novidades.sql.
-- =====================================================================

-- Localização do restaurante (ponto de partida da entrega)
alter table public.restaurantes add column if not exists latitude double precision;
alter table public.restaurantes add column if not exists longitude double precision;

-- Como cobrar a entrega: por bairro (como sempre foi) ou por distância
alter table public.restaurante_operacao add column if not exists frete_modo text not null default 'bairro';
alter table public.restaurante_operacao add column if not exists frete_faixas jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'restaurante_operacao_frete_modo_check') then
    alter table public.restaurante_operacao
      add constraint restaurante_operacao_frete_modo_check check (frete_modo in ('bairro', 'km'));
  end if;
end $$;

-- Distância calculada de cada pedido (aparece no painel e na impressão)
alter table public.pedidos add column if not exists distancia_km numeric(6,2);

-- ---------------------------------------------------------------------
-- Pix na chave do restaurante: o cliente paga direto para o restaurante
-- (sem taxa da plataforma) e o restaurante confere no banco dele.
-- Fica numa tabela só do servidor; o cardápio recebe a chave apenas
-- na tela de pagamento.
-- ---------------------------------------------------------------------
do $$
declare
  tipo_restaurante text;
begin
  select format_type(a.atttypid, a.atttypmod) into tipo_restaurante
    from pg_attribute a
   where a.attrelid = 'public.restaurantes'::regclass and a.attname = 'id';

  execute format($f$
    create table if not exists public.pix_chave_restaurante (
      restaurante_id %s primary key references public.restaurantes(id) on delete cascade,
      ativo boolean not null default false,
      tipo text not null check (tipo in ('cpf', 'cnpj', 'celular', 'email', 'aleatoria')),
      chave text not null check (length(chave) between 1 and 77),
      nome_recebedor text not null check (length(nome_recebedor) between 1 and 25),
      cidade text not null check (length(cidade) between 1 and 15),
      updated_at timestamptz not null default now()
    )$f$, tipo_restaurante);
end $$;

alter table public.pix_chave_restaurante enable row level security;
revoke all on public.pix_chave_restaurante from anon, authenticated;
