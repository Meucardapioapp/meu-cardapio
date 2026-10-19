-- =====================================================================
-- MeuCardapioApp: SQL 13 — painel ANTIGO volta a mostrar os pedidos
--
-- Problema: no site que está no ar, Dashboard e Pedidos aparecem zerados.
-- Os pedidos NÃO foram apagados: o navegador do dono só não estava
-- tendo permissão de enxergá-los (regra de acesso do banco).
--
-- O que faz (pode rodar quantas vezes quiser):
--   1. Recria a função que diz "quais restaurantes são do usuário logado".
--   2. Recria a regra "o dono LÊ os pedidos do próprio restaurante".
--   3. Recria a regra "o dono muda o STATUS dos próprios pedidos".
--   4. Garante a permissão de leitura para quem está logado.
--   Ninguém de fora (sem login) passa a ver pedidos.
--   No final mostra um resumo para conferência.
-- =====================================================================

-- 1. Função auxiliar (mesmo tipo do id da tabela restaurantes)
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

-- 2 e 3. Regras dos pedidos (as outras regras da tabela continuam)
alter table public.pedidos enable row level security;

drop policy if exists "dono le pedidos do proprio restaurante" on public.pedidos;
create policy "dono le pedidos do proprio restaurante" on public.pedidos
  for select to authenticated
  using (restaurante_id in (select public.meus_restaurantes()));

drop policy if exists "dono altera status dos proprios pedidos" on public.pedidos;
create policy "dono altera status dos proprios pedidos" on public.pedidos
  for update to authenticated
  using (restaurante_id in (select public.meus_restaurantes()))
  with check (restaurante_id in (select public.meus_restaurantes()));

-- 4. Permissões: logado lê e muda só o status; sem login não vê nada
grant select on public.pedidos to authenticated;
grant update (status) on public.pedidos to authenticated;
revoke all on public.pedidos from anon;

-- Resumo para conferência (aparece embaixo, em "Results")
select
  (select count(*) from public.pedidos)                                         as pedidos_no_banco,
  (select count(*) from public.pedidos where created_at > now() - interval '90 days') as pedidos_ultimos_90_dias,
  (select count(*) from public.restaurantes where auth_user_id is not null)     as restaurantes_com_login,
  (select string_agg(policyname || ' (' || cmd || ', ' || permissive || ')', ' | ')
     from pg_policies where schemaname = 'public' and tablename = 'pedidos')    as regras_de_pedidos,
  (select string_agg(distinct privilege_type, ', ')
     from information_schema.role_table_grants
    where table_schema = 'public' and table_name = 'pedidos' and grantee = 'authenticated') as permissoes_logado,
  has_function_privilege('authenticated', 'public.meus_restaurantes()', 'execute') as funcao_ok;
