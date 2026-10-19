-- =====================================================================
-- MeuCardapioApp: SQL 15 — Restaurante (salão): mesas, comandas e equipe
--
-- O que faz (pode rodar mais de uma vez):
--   * Equipe: a tabela de motoboys vira "funcionarios" (garçom, cozinha
--     e motoboy), com o mesmo acesso por celular + PIN.
--   * Comandas por mesa e os itens lançados pelos garçons.
--   * Em qual setor cada categoria é preparada (cozinha, churrasqueira, bar).
--   * Pedido feito pelo QR Code da mesa entra direto na comanda da mesa.
--   * Só o servidor acessa essas tabelas (o navegador não lê nada direto).
--
-- Compatível com o site antigo: só cria tabelas novas e ACRESCENTA colunas.
-- Pode rodar mesmo sem ter rodado o SQL 14.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Equipe (funcionários com acesso pelo celular)
-- ---------------------------------------------------------------------
do $$
declare
  tipo_id text;
begin
  select format_type(a.atttypid, a.atttypmod) into tipo_id
    from pg_attribute a
   where a.attrelid = 'public.restaurantes'::regclass and a.attname = 'id';

  if to_regclass('public.funcionarios') is null then
    if to_regclass('public.motoboys') is not null then
      -- Já rodou o SQL 14: aproveita os motoboys cadastrados.
      alter table public.motoboys rename to funcionarios;
      alter index if exists motoboys_restaurante_telefone_key rename to funcionarios_restaurante_telefone_key;
      alter index if exists motoboys_telefone_idx rename to funcionarios_telefone_idx;
    else
      execute format($f$
        create table public.funcionarios (
          id              uuid primary key default gen_random_uuid(),
          restaurante_id  %s not null references public.restaurantes(id) on delete cascade,
          nome            text not null,
          telefone        text not null,
          pin_hash        text not null,
          ativo           boolean not null default true,
          sessao_versao   integer not null default 1,
          ultimo_acesso   timestamptz,
          created_at      timestamptz not null default now()
        )
      $f$, tipo_id);
    end if;
  end if;
end $$;

alter table public.funcionarios add column if not exists funcao text not null default 'motoboy';
alter table public.funcionarios add column if not exists setor text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'funcionarios_funcao_check') then
    alter table public.funcionarios
      add constraint funcionarios_funcao_check check (funcao in ('garcom', 'cozinha', 'motoboy'));
  end if;
end $$;

create unique index if not exists funcionarios_restaurante_telefone_key
  on public.funcionarios (restaurante_id, telefone);
create index if not exists funcionarios_telefone_idx on public.funcionarios (telefone);

alter table public.funcionarios enable row level security;
revoke all on public.funcionarios from anon, authenticated;

-- Pedidos de entrega: quem leva (igual ao SQL 14, caso não tenha rodado)
alter table public.pedidos add column if not exists motoboy_id uuid references public.funcionarios(id) on delete set null;
alter table public.pedidos add column if not exists motoboy_nome text;
alter table public.pedidos add column if not exists motoboy_enviado_em timestamptz;
alter table public.pedidos add column if not exists motoboy_saiu_em timestamptz;
alter table public.pedidos add column if not exists entregue_em timestamptz;
create index if not exists pedidos_motoboy_idx
  on public.pedidos (motoboy_id, motoboy_enviado_em desc)
  where motoboy_id is not null;

-- ---------------------------------------------------------------------
-- 2. Configuração do salão e setor de preparo de cada categoria
-- ---------------------------------------------------------------------
do $$
declare
  tipo_id text;
begin
  select format_type(a.atttypid, a.atttypmod) into tipo_id
    from pg_attribute a
   where a.attrelid = 'public.restaurantes'::regclass and a.attname = 'id';

  if to_regclass('public.salao_config') is null then
    execute format($f$
      create table public.salao_config (
        restaurante_id      %s primary key references public.restaurantes(id) on delete cascade,
        setores             text[] not null default array['Cozinha', 'Churrasqueira', 'Bar'],
        taxa_percentual     numeric(5,2) not null default 10,
        taxa_ligada_padrao  boolean not null default false,
        atualizado_em       timestamptz not null default now()
      )
    $f$, tipo_id);
  end if;

  if to_regclass('public.comandas') is null then
    execute format($f$
      create table public.comandas (
        id                uuid primary key default gen_random_uuid(),
        restaurante_id    %s not null references public.restaurantes(id) on delete cascade,
        numero            integer not null,
        mesa              text not null,
        status            text not null default 'aberta' check (status in ('aberta', 'fechada', 'cancelada')),
        pediu_conta       boolean not null default false,
        pessoas           integer,
        cliente_nome      text,
        garcom_id         uuid references public.funcionarios(id) on delete set null,
        garcom_nome       text,
        taxa_servico      boolean not null default false,
        taxa_percentual   numeric(5,2) not null default 10,
        subtotal          numeric(10,2) not null default 0,
        taxa_valor        numeric(10,2) not null default 0,
        desconto          numeric(10,2) not null default 0,
        pago_antecipado   numeric(10,2) not null default 0,
        total             numeric(10,2) not null default 0,
        forma_pagamento   text,
        pagamentos        jsonb not null default '[]'::jsonb,
        troco             numeric(10,2) not null default 0,
        aberta_em         timestamptz not null default now(),
        atualizada_em     timestamptz not null default now(),
        fechada_em        timestamptz,
        fechada_por       text
      )
    $f$, tipo_id);
  end if;

  if to_regclass('public.comanda_itens') is null then
    execute format($f$
      create table public.comanda_itens (
        id              uuid primary key default gen_random_uuid(),
        comanda_id      uuid not null references public.comandas(id) on delete cascade,
        restaurante_id  %s not null references public.restaurantes(id) on delete cascade,
        lancamento      uuid not null,
        produto_id      text,
        nome            text not null,
        detalhes        jsonb not null default '[]'::jsonb,
        observacao      text,
        quantidade      integer not null check (quantidade between 1 and 99),
        preco_unit      numeric(10,2) not null default 0,
        setor           text,
        status          text not null default 'novo' check (status in ('novo', 'pronto', 'entregue', 'cancelado')),
        origem          text not null default 'garcom',
        lancado_por_id  uuid references public.funcionarios(id) on delete set null,
        lancado_por     text,
        pronto_por_id   uuid references public.funcionarios(id) on delete set null,
        criado_em       timestamptz not null default now(),
        alterado_em     timestamptz,
        pronto_em       timestamptz,
        entregue_em     timestamptz,
        cancelado_em    timestamptz,
        cancelado_por   text
      )
    $f$, tipo_id);
  end if;
end $$;

alter table public.categorias add column if not exists setor_preparo text;

-- Só uma comanda aberta por mesa; número da comanda único por restaurante.
create unique index if not exists comandas_mesa_aberta_key
  on public.comandas (restaurante_id, lower(mesa)) where status = 'aberta';
create unique index if not exists comandas_numero_key on public.comandas (restaurante_id, numero);
create index if not exists comandas_fechadas_idx on public.comandas (restaurante_id, fechada_em desc) where status = 'fechada';
create index if not exists comanda_itens_comanda_idx on public.comanda_itens (comanda_id);
create index if not exists comanda_itens_preparo_idx
  on public.comanda_itens (restaurante_id, status, criado_em) where status in ('novo', 'pronto');

-- Pedido do QR Code da mesa: em qual comanda entrou
alter table public.pedidos add column if not exists comanda_id uuid references public.comandas(id) on delete set null;

alter table public.salao_config enable row level security;
alter table public.comandas enable row level security;
alter table public.comanda_itens enable row level security;
revoke all on public.salao_config, public.comandas, public.comanda_itens from anon, authenticated;

select 'Salão pronto' as resultado,
       (select count(*) from public.funcionarios) as funcionarios,
       (select count(*) from public.comandas) as comandas,
       -- Se aparecer algum nome aqui, avise: o link desse cardápio conflita com as telas novas.
       (select string_agg(slug, ', ') from public.restaurantes
         where slug in ('equipe', 'garcom', 'cozinha', 'entregador')) as links_em_conflito;
