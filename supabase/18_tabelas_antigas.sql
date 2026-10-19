-- =====================================================================
-- MeuCardapioApp: SQL 18 — fechar tabelas antigas que ninguém usa
-- (rodar AGORA, com o site antigo no ar; não apaga nenhum dado)
--
-- "orders", "faixas_entrega" e "taxas_entrega" são sobras do começo do
-- projeto: nem o site antigo nem o novo usam. A "orders" estava com regras
-- que deixavam QUALQUER pessoa ler, criar, alterar e apagar.
-- Aqui tiramos todas as regras e permissões delas (os dados ficam lá,
-- só o servidor/você no Supabase enxerga).
-- =====================================================================

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

-- Confere: precisa voltar vazio.
select tablename, policyname from pg_policies
 where schemaname = 'public' and tablename in ('orders', 'faixas_entrega', 'taxas_entrega');
