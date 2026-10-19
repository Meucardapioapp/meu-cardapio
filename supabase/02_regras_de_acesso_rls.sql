-- =====================================================================
-- MeuCardapioApp: regras de acesso do banco (RLS) — parte 2
--
-- O que faz:
--   * Cardápio público continua podendo LER produtos, categorias etc.
--   * Só o dono logado consegue ALTERAR os dados do PRÓPRIO restaurante.
--   * Pedidos: o dono só enxerga os do próprio restaurante (painel/tempo real).
--   * Clientes, endereços, fidelidade dos clientes e saques: só o servidor.
--
-- ATENÇÃO: este script APAGA as políticas antigas das tabelas listadas
-- e cria as novas. Rode a parte 1 antes. Depois de rodar, abra o painel
-- e o cardápio e faça um pedido de teste.
--
-- O script descobre sozinho como cada tabela se liga ao restaurante
-- (restaurante_id, produto_id ou grupo_id). Tabela que não se encaixar
-- é ignorada e aparece numa mensagem (NOTICE) no final.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Função auxiliar: IDs dos restaurantes do usuário logado.
-- ---------------------------------------------------------------------
do $$
declare
  tipo_id text;
begin
  select format_type(a.atttypid, a.atttypmod) into tipo_id
    from pg_attribute a
   where a.attrelid = 'public.restaurantes'::regclass and a.attname = 'id';

  execute format($f$
    create or replace function public.meus_restaurantes()
    returns setof %s
    language sql
    stable
    security definer
    set search_path = public
    as $fn$
      select id from public.restaurantes where auth_user_id = auth.uid()
    $fn$
  $f$, tipo_id);
end $$;

revoke all on function public.meus_restaurantes() from public, anon;
grant execute on function public.meus_restaurantes() to authenticated;

-- ---------------------------------------------------------------------
-- Aplica as regras.
-- ---------------------------------------------------------------------
do $$
declare
  -- Tabelas do cardápio: leitura pública, escrita só do dono.
  tabelas_cardapio text[] := array[
    'aparencia','categorias','produtos','products','adicionais',
    'grupos_obrigatorios','grupo_obrigatorio_opcoes','bairros_entrega',
    'fidelidade','banners','logos'
  ];
  -- Tabelas privadas do dono (sem leitura pública).
  tabelas_dono text[] := array['configuracoes_pagamento'];
  -- Tabelas só do servidor (nenhum acesso pelo navegador).
  tabelas_servidor text[] := array[
    'clientes','enderecos_cliente','cliente_fidelidade','saques'
  ];

  t text;
  pol record;
  condicao text;
  ignoradas text[] := '{}';

begin
  -- ===== restaurantes =====
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'restaurantes' loop
    execute format('drop policy %I on public.restaurantes', pol.policyname);
  end loop;

  alter table public.restaurantes enable row level security;
  create policy "cardapio publico le restaurantes" on public.restaurantes
    for select using (true);
  create policy "dono altera o proprio restaurante" on public.restaurantes
    for update to authenticated
    using (auth_user_id = auth.uid())
    with check (auth_user_id = auth.uid());
  -- Cadastro e exclusão de restaurante só pelo servidor.

  -- ===== pedidos =====
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'pedidos' loop
    execute format('drop policy %I on public.pedidos', pol.policyname);
  end loop;

  alter table public.pedidos enable row level security;
  create policy "dono le pedidos do proprio restaurante" on public.pedidos
    for select to authenticated
    using (restaurante_id in (select public.meus_restaurantes()));
  -- Criar, alterar e apagar pedidos: só pelo servidor (rotas /api).
  revoke insert, update, delete on public.pedidos from anon, authenticated;

  -- ===== tabelas do cardápio e do dono =====
  foreach t in array tabelas_cardapio || tabelas_dono loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;

    if exists (select 1 from information_schema.columns
                where table_schema = 'public' and table_name = t and column_name = 'restaurante_id') then
      condicao := 'restaurante_id in (select public.meus_restaurantes())';
    elsif exists (select 1 from information_schema.columns
                   where table_schema = 'public' and table_name = t and column_name = 'produto_id')
          and to_regclass('public.produtos') is not null then
      condicao := 'produto_id in (select p.id from public.produtos p where p.restaurante_id in (select public.meus_restaurantes()))';
    elsif exists (select 1 from information_schema.columns
                   where table_schema = 'public' and table_name = t and column_name = 'grupo_id')
          and to_regclass('public.grupos_obrigatorios') is not null then
      condicao := 'grupo_id in (select g.id from public.grupos_obrigatorios g join public.produtos p on p.id = g.produto_id where p.restaurante_id in (select public.meus_restaurantes()))';
    else
      ignoradas := ignoradas || t;
      continue;
    end if;

    for pol in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy %I on public.%I', pol.policyname, t);
    end loop;

    execute format('alter table public.%I enable row level security', t);

    if t = any (tabelas_cardapio) then
      execute format('create policy "cardapio publico le" on public.%I for select using (true)', t);
    else
      execute format('create policy "dono le" on public.%I for select to authenticated using (%s)', t, condicao);
    end if;

    execute format('create policy "dono insere" on public.%I for insert to authenticated with check (%s)', t, condicao);
    execute format('create policy "dono altera" on public.%I for update to authenticated using (%s) with check (%s)', t, condicao, condicao);
    execute format('create policy "dono apaga" on public.%I for delete to authenticated using (%s)', t, condicao);
  end loop;

  -- ===== tabelas só do servidor =====
  foreach t in array tabelas_servidor loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;

    for pol in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy %I on public.%I', pol.policyname, t);
    end loop;

    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;

  if array_length(ignoradas, 1) > 0 then
    raise notice 'Tabelas sem ligação com restaurante (não alteradas): %', ignoradas;
  end if;
end $$;
