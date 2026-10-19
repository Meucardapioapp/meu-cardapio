-- =====================================================================
-- MeuCardapioApp: SQL 17 — CORREÇÃO URGENTE (rodar AGORA, com o site antigo no ar)
--
-- Problema: o Supabase dá, sozinho, permissão total ao visitante (chave
-- pública do site) em toda tabela e vista nova. A vista pública dos
-- restaurantes ("restaurantes_publico") ficou com permissão de ALTERAR e
-- APAGAR — e vista ignora as regras de acesso. Ou seja: qualquer pessoa
-- com conhecimento técnico conseguia mudar nome, link e WhatsApp de
-- qualquer restaurante, ou apagar restaurantes.
--
-- O que faz: tira do visitante e de quem está logado a permissão de
-- escrever em QUALQUER vista e as permissões que nunca são usadas
-- (truncate, references, trigger) em todas as tabelas.
-- NÃO muda nada que o site antigo usa. Pode rodar mais de uma vez.
-- =====================================================================

do $$
declare
  t record;
begin
  for t in
    select c.relname, c.relkind from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm')
  loop
    if t.relkind in ('v', 'm') then
      -- Vistas: só leitura (ou nada), nunca escrita.
      execute format('revoke insert, update, delete, truncate, references, trigger on public.%I from public, anon, authenticated', t.relname);
    else
      execute format('revoke truncate, references, trigger on public.%I from public, anon, authenticated', t.relname);
    end if;
  end loop;
end $$;

-- Confere: precisa voltar vazio.
select c.relname as vista_com_escrita, g.grantee, g.privilege_type
  from information_schema.role_table_grants g
  join pg_class c on c.relname = g.table_name
  join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
 where g.table_schema = 'public' and c.relkind in ('v', 'm')
   and g.grantee in ('anon', 'authenticated', 'PUBLIC')
   and g.privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE');
