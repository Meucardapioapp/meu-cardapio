-- =====================================================================
-- MeuCardapioApp: SQL 24 — repetir o mesmo complemento (ex.: 3x bolacha)
--
-- Cria a opção "Cliente pode repetir o mesmo item" nas escolhas dos
-- produtos. Com ela ligada, o cliente usa − 1 + em cada opção e o preço soma
-- só no item (3 bolachas de R$ 2 num açaí de R$ 10 = R$ 16).
--
-- Não apaga nenhum dado. Pode rodar mais de uma vez.
-- =====================================================================

alter table public.grupos_obrigatorios
  add column if not exists permite_repetir boolean not null default false;

-- Confere: precisa mostrar 1 linha.
select table_name, column_name, data_type, column_default
  from information_schema.columns
 where table_schema = 'public'
   and table_name = 'grupos_obrigatorios'
   and column_name = 'permite_repetir';
