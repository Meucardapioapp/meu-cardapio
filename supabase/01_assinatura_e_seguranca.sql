-- =====================================================================
-- MeuCardapioApp: assinatura + segurança (parte 1)
--
-- Como rodar: Supabase → SQL Editor → New query → cole tudo → Run.
-- Rode ANTES (ou junto) de publicar a nova versão do código.
-- Pode rodar mais de uma vez sem problema (é idempotente).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 0. Se o banco já tem tabelas antigas com estes nomes (de uma versão
--    anterior do sistema) e com outro formato, elas são RENOMEADAS para
--    <nome>_antiga. Nada é apagado: os dados antigos continuam lá.
-- ---------------------------------------------------------------------
do $$
declare
  t record;
  faltando int;
  novo_nome text;
  n int;
  idx record;
  seq record;
begin
  for t in
    select * from (values
      ('assinaturas', array['restaurante_id','status','plano','metodo','acesso_ate',
                            'pagarme_subscription_id','pagarme_customer_id',
                            'cartao_final','cartao_bandeira','created_at','updated_at']),
      ('pagamentos_assinatura', array['restaurante_id','pagarme_order_id','pagarme_invoice_id',
                            'plano','metodo','valor','status','pago_em']),
      ('restaurantes_financeiro', array['restaurante_id','cpf_cnpj','banco','agencia','conta',
                            'tipo_conta','digito_agencia','digito_conta',
                            'pagarme_recipient_id','pagarme_status','updated_at']),
      ('contador_pedidos', array['restaurante_id','ultimo'])
    ) as v(tabela, colunas)
  loop
    if to_regclass('public.' || t.tabela) is null then
      continue;
    end if;

    select count(*) into faltando
      from unnest(t.colunas) as c(nome)
     where not exists (
       select 1 from information_schema.columns
        where table_schema = 'public' and table_name = t.tabela and column_name = c.nome);

    if faltando = 0 then
      continue;  -- já está no formato novo
    end if;

    -- escolhe um nome livre: assinaturas_antiga, assinaturas_antiga2, ...
    novo_nome := t.tabela || '_antiga';
    n := 1;
    while to_regclass('public.' || novo_nome) is not null loop
      n := n + 1;
      novo_nome := t.tabela || '_antiga' || n;
    end loop;

    -- renomeia índices e sequências da tabela antiga para não colidir com a nova
    for idx in
      select i.relname from pg_index x
        join pg_class i on i.oid = x.indexrelid
       where x.indrelid = ('public.' || t.tabela)::regclass
    loop
      execute format('alter index public.%I rename to %I',
                     idx.relname, left(novo_nome || '_' || idx.relname, 63));
    end loop;

    for seq in
      select s.relname from pg_class s
        join pg_depend d on d.objid = s.oid and d.deptype in ('a','i')
       where s.relkind = 'S'
         and d.refobjid = ('public.' || t.tabela)::regclass
    loop
      execute format('alter sequence public.%I rename to %I',
                     seq.relname, left(novo_nome || '_' || seq.relname, 63));
    end loop;

    execute format('alter table public.%I rename to %I', t.tabela, novo_nome);
    execute format('alter table public.%I enable row level security', novo_nome);
    execute format('revoke all on public.%I from anon, authenticated', novo_nome);
    raise notice 'Tabela antiga public.% renomeada para public.%', t.tabela, novo_nome;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 1. Pedidos: código secreto para o cliente acompanhar o pedido
--    (antes qualquer um via os pedidos de todos mudando o número na URL)
--    e campo de troco.
-- ---------------------------------------------------------------------
alter table public.pedidos
  add column if not exists codigo_acesso uuid not null default gen_random_uuid();

create unique index if not exists pedidos_codigo_acesso_key
  on public.pedidos (codigo_acesso);

alter table public.pedidos
  add column if not exists troco_para numeric(10,2);

-- ---------------------------------------------------------------------
-- 2. Tabelas novas. O tipo do restaurante_id acompanha o tipo de
--    restaurantes.id (uuid ou número), descoberto automaticamente.
-- ---------------------------------------------------------------------
do $$
declare
  tipo_id text;
begin
  select format_type(a.atttypid, a.atttypmod)
    into tipo_id
    from pg_attribute a
   where a.attrelid = 'public.restaurantes'::regclass
     and a.attname = 'id';

  -- Plano de cada restaurante
  execute format($f$
    create table if not exists public.assinaturas (
      restaurante_id %s primary key references public.restaurantes(id) on delete cascade,
      status text not null default 'trial'
        check (status in ('trial','ativa','inadimplente','cancelada','expirada')),
      plano text check (plano in ('mensal','anual')),
      metodo text check (metodo in ('cartao','pix')),
      acesso_ate timestamptz not null,
      pagarme_subscription_id text unique,
      pagarme_customer_id text,
      cartao_final text,
      cartao_bandeira text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )$f$, tipo_id);

  -- Histórico de pagamentos do plano (garante que cada pagamento conta 1 vez)
  execute format($f$
    create table if not exists public.pagamentos_assinatura (
      id bigint generated always as identity primary key,
      restaurante_id %s not null references public.restaurantes(id) on delete cascade,
      pagarme_order_id text unique,
      pagarme_invoice_id text unique,
      plano text,
      metodo text,
      valor numeric(10,2),
      status text not null default 'pending',
      pago_em timestamptz,
      created_at timestamptz not null default now()
    )$f$, tipo_id);

  -- Dados bancários e recebedor Pagar.me (só o servidor lê)
  execute format($f$
    create table if not exists public.restaurantes_financeiro (
      restaurante_id %s primary key references public.restaurantes(id) on delete cascade,
      cpf_cnpj text,
      banco text,
      agencia text,
      conta text,
      tipo_conta text,
      digito_agencia text,
      digito_conta text,
      pagarme_recipient_id text,
      pagarme_status text,
      updated_at timestamptz not null default now()
    )$f$, tipo_id);

  -- Contador do número do pedido por restaurante (sem duplicar)
  execute format($f$
    create table if not exists public.contador_pedidos (
      restaurante_id %s primary key references public.restaurantes(id) on delete cascade,
      ultimo bigint not null default 0
    )$f$, tipo_id);

  -- Função que entrega o próximo número de pedido de forma atômica
  execute format($f$
    create or replace function public.proximo_numero_pedido(p_restaurante_id %s)
    returns bigint
    language plpgsql
    security definer
    set search_path = public
    as $fn$
    declare
      proximo bigint;
    begin
      insert into public.contador_pedidos (restaurante_id, ultimo)
      values (
        p_restaurante_id,
        coalesce((select max(numero_pedido) from public.pedidos where restaurante_id = p_restaurante_id), 0) + 1
      )
      on conflict (restaurante_id)
      do update set ultimo = public.contador_pedidos.ultimo + 1
      returning ultimo into proximo;

      return proximo;
    end
    $fn$
    $f$, tipo_id);
end $$;

create table if not exists public.planos_pagarme (
  plano text primary key,
  pagarme_plan_id text not null,
  preco_centavos integer not null,
  updated_at timestamptz not null default now()
);

-- A função só pode ser chamada pelo servidor.
do $$
declare
  assinatura text;
begin
  select p.oid::regprocedure::text into assinatura
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'proximo_numero_pedido'
   limit 1;

  execute format('revoke all on function %s from public, anon, authenticated', assinatura);
end $$;

-- ---------------------------------------------------------------------
-- 3. Tabelas novas: RLS ligado e nenhuma política = só o servidor
--    (chave service_role) consegue ler e escrever.
-- ---------------------------------------------------------------------
alter table public.assinaturas            enable row level security;
alter table public.pagamentos_assinatura  enable row level security;
alter table public.restaurantes_financeiro enable row level security;
alter table public.contador_pedidos       enable row level security;
alter table public.planos_pagarme         enable row level security;

revoke all on public.assinaturas, public.pagamentos_assinatura,
              public.restaurantes_financeiro, public.contador_pedidos,
              public.planos_pagarme
  from anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. Move os dados bancários para a tabela protegida e apaga as cópias
--    da tabela restaurantes (que o cardápio público consegue ler).
-- ---------------------------------------------------------------------
do $$
declare
  colunas text[] := array['cpf_cnpj','banco','agencia','conta','tipo_conta',
                          'digito_agencia','digito_conta','pagarme_recipient_id','pagarme_status'];
  existentes text[];
  c text;
  lista_insert text := '';
  lista_select text := '';
  lista_update text := '';
begin
  select array_agg(column_name::text) into existentes
    from information_schema.columns
   where table_schema = 'public' and table_name = 'restaurantes'
     and column_name = any (colunas);

  if existentes is null then
    raise notice 'Nenhuma coluna bancária encontrada em restaurantes (já migrado).';
    return;
  end if;

  foreach c in array existentes loop
    lista_insert := lista_insert || format(', %I', c);
    -- O marcador "•••" (SQL 11, só para a versão antiga) nunca substitui o dado real.
    lista_select := lista_select || format(', case when r.%I::text like ''%%•%%'' then null else r.%I::text end', c, c);
    lista_update := lista_update || format(', %I = coalesce(excluded.%I, restaurantes_financeiro.%I)', c, c, c);
  end loop;

  execute format(
    'insert into public.restaurantes_financeiro (restaurante_id%s)
     select r.id%s from public.restaurantes r
     on conflict (restaurante_id) do update set updated_at = now()%s',
    lista_insert, lista_select, lista_update
  );

  -- Limpa as cópias expostas (as colunas ficam vazias; podem ser apagadas depois).
  foreach c in array existentes loop
    execute format('update public.restaurantes set %I = null where %I is not null', c, c);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 5. Teste grátis para os restaurantes que já existem.
--    Todos ganham 7 dias a partir de hoje para assinar.
--    (Quer dar mais prazo para a base atual? Troque '7 days' abaixo.)
-- ---------------------------------------------------------------------
insert into public.assinaturas (restaurante_id, status, acesso_ate)
select r.id, 'trial', now() + interval '7 days'
  from public.restaurantes r
on conflict (restaurante_id) do nothing;

-- ---------------------------------------------------------------------
-- 6. A view de clientes do painel passa a respeitar as permissões de
--    quem consulta (antes ela ignorava o RLS e expunha todos os clientes).
--    O painel agora lê essa view pelo servidor.
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_views where schemaname = 'public' and viewname = 'vw_clientes_admin') then
    execute 'alter view public.vw_clientes_admin set (security_invoker = true)';
    execute 'revoke all on public.vw_clientes_admin from anon';
  end if;
end $$;
