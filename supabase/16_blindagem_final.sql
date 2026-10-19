-- =====================================================================
-- MeuCardapioApp: SQL 16 — BLINDAGEM FINAL (rodar NO DIA do lançamento)
--
-- Ordem no dia: publicar o site novo → 01 → 05 → ESTE → 07.
-- NÃO rode enquanto o site antigo estiver no ar (ele lê e grava direto
-- pelo navegador e pararia de funcionar).
--
-- O que faz (pode rodar mais de uma vez):
--   1. Visitante sem login (anon) não escreve em NENHUMA tabela.
--   2. Remove as liberações que existiam só para o site antigo.
--   3. Ninguém pelo navegador chama funções internas do banco.
--   4. Tabelas e funções criadas no futuro já nascem fechadas.
--   5. No final mostra a auditoria: o ideal é não aparecer nenhuma linha
--      de gravidade ALTA.
-- =====================================================================

-- 1. Visitante: só leitura do cardápio público
do $$
declare
  t record;
begin
  for t in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm')
  loop
    execute format('revoke insert, update, delete, truncate, references, trigger on public.%I from anon', t.relname);
    -- Logado também não precisa de truncate/references/trigger em nada
    execute format('revoke truncate, references, trigger on public.%I from authenticated', t.relname);
  end loop;
end $$;

-- Formas de pagamento: o cardápio lê pelo servidor; o navegador só do dono.
revoke all on public.configuracoes_pagamento from anon;

-- 2. Liberações do site antigo (SQL 06 e 13)
drop policy if exists "dono altera status dos proprios pedidos" on public.pedidos;
revoke update on public.pedidos from authenticated;
revoke insert, delete on public.pedidos from authenticated;

do $$
begin
  if to_regclass('public.clientes') is not null then
    drop policy if exists "dono le os proprios clientes" on public.clientes;
    revoke all on public.clientes from anon, authenticated;
  end if;
  if to_regclass('public.cliente_fidelidade') is not null then
    drop policy if exists "dono le a fidelidade dos proprios clientes" on public.cliente_fidelidade;
    revoke all on public.cliente_fidelidade from anon, authenticated;
  end if;
  if to_regclass('public.vw_clientes_admin') is not null then
    revoke all on public.vw_clientes_admin from anon, authenticated;
  end if;
  if to_regclass('storage.objects') is not null then
    drop policy if exists "versao antiga envia fotos" on storage.objects;
  end if;
exception
  when insufficient_privilege then
    raise notice 'Sem permissão para alterar o Storage pelo SQL (ok se o 05 já rodou).';
end $$;

-- A tabela restaurantes completa: o visitante NÃO lê (o cardápio usa a vista pública).
revoke select on public.restaurantes from anon;
do $$
begin
  if to_regclass('public.restaurantes_publico') is not null then
    grant select on public.restaurantes_publico to anon, authenticated;
  end if;
end $$;

-- 2b. Tabelas antigas sem uso (mesmo do SQL 18)
do $$
declare
  t text;
  pol record;
begin
  foreach t in array array['orders', 'faixas_entrega', 'taxas_entrega'] loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;
    for pol in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy %I on public.%I', pol.policyname, t);
    end loop;
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
  end loop;
end $$;

-- 3. Funções internas: só o servidor chama
do $$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as assinatura, p.proname
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prokind = 'f'
  loop
    if f.proname = 'meus_restaurantes'
       or exists (select 1 from pg_policies p
                   where p.qual ilike '%' || f.proname || '(%' or p.with_check ilike '%' || f.proname || '(%') then
      -- usada pelas regras de acesso (o painel precisa); o visitante não
      execute format('revoke all on function %s from public, anon', f.assinatura);
      execute format('grant execute on function %s to authenticated', f.assinatura);
    else
      execute format('revoke all on function %s from public, anon, authenticated', f.assinatura);
    end if;
  end loop;
end $$;

-- 4. O que for criado no futuro já nasce fechado para o navegador
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- Tempo máximo de uma consulta vinda do navegador (evita travar o banco)
alter role anon set statement_timeout = '8s';
alter role authenticated set statement_timeout = '15s';

-- 5. Auditoria (mesma do arquivo 99): resultado vazio = tudo certo.
select 'Blindagem final aplicada. Agora rode o 99_auditoria_seguranca.sql para conferir.' as resultado;
