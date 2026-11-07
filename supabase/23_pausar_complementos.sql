-- =====================================================================
-- MeuCardapioApp: SQL 23 — pausar complementos e adicionais
--
-- Cria a marca "pausado" nas opções das escolhas obrigatórias e nos
-- adicionais. Complemento pausado some do cardápio até o dono ativar de novo
-- (ex.: acabou o leite condensado).
--
-- Não apaga nenhum dado. Pode rodar mais de uma vez.
-- =====================================================================

alter table public.grupo_obrigatorio_opcoes
  add column if not exists pausado boolean not null default false;

alter table public.adicionais
  add column if not exists pausado boolean not null default false;

-- Confere: precisa mostrar 2 linhas, uma de cada tabela.
select table_name, column_name, data_type, column_default
  from information_schema.columns
 where table_schema = 'public'
   and column_name = 'pausado'
   and table_name in ('grupo_obrigatorio_opcoes', 'adicionais');
