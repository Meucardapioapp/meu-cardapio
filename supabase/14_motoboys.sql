-- =====================================================================
-- MeuCardapioApp: SQL 14 — motoboys (entregadores)
--
-- O que faz (pode rodar mais de uma vez):
--   * Cria a tabela "motoboys" (nome, celular, PIN de acesso).
--   * Adiciona nos pedidos: qual motoboy leva, quando foi enviado,
--     quando saiu e quando foi entregue.
--   * Só o servidor acessa os motoboys (o navegador não lê nada direto).
--
-- Compatível com o site antigo: só ACRESCENTA colunas nos pedidos.
-- =====================================================================

create extension if not exists pgcrypto;

do $$
declare
  tipo_id text;
begin
  select format_type(a.atttypid, a.atttypmod) into tipo_id
    from pg_attribute a
   where a.attrelid = 'public.restaurantes'::regclass and a.attname = 'id';

  if to_regclass('public.motoboys') is null then
    execute format($f$
      create table public.motoboys (
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
end $$;

create unique index if not exists motoboys_restaurante_telefone_key
  on public.motoboys (restaurante_id, telefone);
create index if not exists motoboys_telefone_idx on public.motoboys (telefone);

alter table public.motoboys enable row level security;
revoke all on public.motoboys from anon, authenticated;

-- Pedidos: quem leva e os horários da entrega
alter table public.pedidos add column if not exists motoboy_id uuid references public.motoboys(id) on delete set null;
alter table public.pedidos add column if not exists motoboy_nome text;
alter table public.pedidos add column if not exists motoboy_enviado_em timestamptz;
alter table public.pedidos add column if not exists motoboy_saiu_em timestamptz;
alter table public.pedidos add column if not exists entregue_em timestamptz;

create index if not exists pedidos_motoboy_idx
  on public.pedidos (motoboy_id, motoboy_enviado_em desc)
  where motoboy_id is not null;

select 'Motoboys prontos' as resultado,
       (select count(*) from public.motoboys) as motoboys_cadastrados;
