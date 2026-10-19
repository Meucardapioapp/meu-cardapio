-- =====================================================================
-- MeuCardapioApp: motivos de cancelamento do plano (parte 10)
-- Só ACRESCENTA uma tabela: pode rodar agora, mesmo com a versão antiga
-- no ar. Pode rodar mais de uma vez.
-- =====================================================================

do $$
declare
  tipo_restaurante text;
begin
  select format_type(a.atttypid, a.atttypmod) into tipo_restaurante
    from pg_attribute a
   where a.attrelid = 'public.restaurantes'::regclass and a.attname = 'id';

  execute format($f$
    create table if not exists public.cancelamentos (
      id bigint generated always as identity primary key,
      restaurante_id %s not null references public.restaurantes(id) on delete cascade,
      motivo text not null check (length(motivo) between 1 and 80),
      melhorar text check (melhorar is null or length(melhorar) <= 1000),
      metodo text,
      tinha_cobranca_automatica boolean not null default false,
      pagarme_subscription_id text,
      acesso_ate timestamptz,
      created_at timestamptz not null default now()
    )$f$, tipo_restaurante);
end $$;

create index if not exists cancelamentos_restaurante_idx on public.cancelamentos (restaurante_id, created_at desc);

-- Só o servidor lê e grava (o navegador não acessa).
alter table public.cancelamentos enable row level security;
revoke all on public.cancelamentos from anon, authenticated;
