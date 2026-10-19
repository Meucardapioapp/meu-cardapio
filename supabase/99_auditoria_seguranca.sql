-- =====================================================================
-- MeuCardapioApp: AUDITORIA DE SEGURANÇA DO BANCO (só lê, não muda nada)
--
-- Rode quando quiser conferir. Cada linha do resultado é um ponto a olhar;
-- a coluna "gravidade" diz o quanto importa. Resultado vazio = tudo certo.
-- =====================================================================

with
-- Tabelas que o navegador do cardápio/painel pode LER (as outras: só o servidor)
publicas(nome) as (values
  ('aparencia'), ('categorias'), ('produtos'), ('products'), ('adicionais'),
  ('grupos_obrigatorios'), ('grupo_obrigatorio_opcoes'), ('bairros_entrega'),
  ('fidelidade'), ('banners'), ('logos')
),
-- Tabelas que o dono logado edita pelo navegador (sempre só as dele)
do_dono(nome) as (values
  ('aparencia'), ('categorias'), ('produtos'), ('products'), ('adicionais'),
  ('grupos_obrigatorios'), ('grupo_obrigatorio_opcoes'), ('bairros_entrega'),
  ('fidelidade'), ('banners'), ('logos'), ('configuracoes_pagamento'),
  ('restaurantes'), ('pedidos')
),
tabelas as (
  select c.oid, c.relname as nome, c.relrowsecurity as rls, c.relkind
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm')
),
problemas as (
  -- 1. Tabela sem RLS
  select 'ALTA' as gravidade, 'Tabela sem regra de acesso (RLS)' as problema, t.nome as onde, '' as detalhe
    from tabelas t where t.relkind in ('r', 'p') and not t.rls

  union all
  -- 2. Visitante sem login (anon) pode escrever em alguma tabela
  select 'ALTA', 'Visitante sem login pode ESCREVER', g.table_name, string_agg(distinct g.privilege_type, ', ')
    from information_schema.role_table_grants g
   where g.table_schema = 'public' and g.grantee = 'anon'
     and g.privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'TRIGGER', 'REFERENCES')
   group by g.table_name

  union all
  -- 3. Visitante lê tabela que não é do cardápio público
  select 'ALTA', 'Visitante sem login pode LER tabela privada', g.table_name, ''
    from information_schema.role_table_grants g
   where g.table_schema = 'public' and g.grantee = 'anon' and g.privilege_type = 'SELECT'
     and g.table_name not in (select nome from publicas) and g.table_name <> 'restaurantes_publico'
   group by g.table_name

  union all
  -- 4. Usuário logado (qualquer um, inclusive cliente que criar conta) acessa tabela que não deveria
  select 'MÉDIA', 'Qualquer usuário logado tem acesso a tabela fora do painel', g.table_name, string_agg(distinct g.privilege_type, ', ')
    from information_schema.role_table_grants g
   where g.table_schema = 'public' and g.grantee = 'authenticated'
     and g.table_name not in (select nome from do_dono) and g.table_name <> 'restaurantes_publico'
   group by g.table_name

  union all
  -- 5. Regra (policy) que libera tudo para todos ("true") em escrita
  select 'ALTA', 'Regra libera escrita para todos', p.tablename, p.policyname || ' (' || p.cmd || ')'
    from pg_policies p
   where p.schemaname = 'public' and p.cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
     and (coalesce(p.qual, '') in ('', 'true') and coalesce(p.with_check, 'true') = 'true')

  union all
  -- 6. Regra de leitura aberta em tabela privada
  select 'ALTA', 'Regra libera leitura de tabela privada para todos', p.tablename, p.policyname
    from pg_policies p
   where p.schemaname = 'public' and p.cmd in ('SELECT', 'ALL') and coalesce(p.qual, 'true') = 'true'
     and p.tablename not in (select nome from publicas)

  union all
  -- 7. Função "security definer" que o navegador pode chamar
  select case when has_function_privilege('anon', f.oid, 'execute') then 'ALTA' else 'MÉDIA' end,
         'Função com poder total que o navegador pode chamar',
         f.proname,
         case when has_function_privilege('anon', f.oid, 'execute') then 'visitante' else 'logado' end
    from pg_proc f join pg_namespace n on n.oid = f.pronamespace
   where n.nspname = 'public' and f.prosecdef
     and f.proname not in ('meus_restaurantes')
     and (has_function_privilege('anon', f.oid, 'execute') or has_function_privilege('authenticated', f.oid, 'execute'))

  union all
  -- 8. Função security definer sem search_path fixo
  select 'MÉDIA', 'Função com poder total sem search_path fixo', f.proname, ''
    from pg_proc f join pg_namespace n on n.oid = f.pronamespace
   where n.nspname = 'public' and f.prosecdef
     and not exists (select 1 from unnest(coalesce(f.proconfig, '{}')) c where c like 'search_path=%')

  union all
  -- 9. Vista (view) que o navegador lê (vista ignora o RLS de quem consulta)
  select 'ALTA', 'Vista acessível pelo navegador', g.table_name, g.grantee
    from information_schema.role_table_grants g join tabelas t on t.nome = g.table_name
   where g.table_schema = 'public' and t.relkind in ('v', 'm') and g.grantee in ('anon', 'authenticated')
     and g.table_name <> 'restaurantes_publico' and g.privilege_type = 'SELECT'
   group by g.table_name, g.grantee

  union all
  -- 10. Colunas sensíveis que o visitante consegue ler na tabela restaurantes
  select 'ALTA', 'Visitante lê coluna sensível de restaurantes', c.column_name, ''
    from information_schema.column_privileges c
   where c.table_schema = 'public' and c.table_name = 'restaurantes' and c.grantee = 'anon' and c.privilege_type = 'SELECT'
     and c.column_name ~* '(auth_user|e_?mail|responsavel|telefone|cpf|cnpj|banco|agencia|conta|digito|recipient|pagarme|token|senha|termos|ip)'

  union all
  -- 11. Dados bancários em texto aberto (fora do formato criptografado)
  select 'ALTA', 'Dado bancário sem criptografia', 'restaurantes_financeiro', x.n || ' linhas'
    from (select case when to_regclass('public.restaurantes_financeiro') is not null then
            (xpath('/row/n/text()', query_to_xml(
              'select count(*) as n from public.restaurantes_financeiro
                where (cpf_cnpj is not null and cpf_cnpj not like ''enc:v1:%'')
                   or (conta is not null and conta not like ''enc:v1:%'')', false, true, '')))[1]::text
          end as n) x
   where coalesce(x.n, '0') <> '0'
)
select * from problemas order by case gravidade when 'ALTA' then 1 when 'MÉDIA' then 2 else 3 end, problema, onde;
