-- 27 · Opção "Não quero / não precisa" (ex.: "Não quero creme")
-- Quando o cliente escolhe essa opção, ela não gasta os complementos grátis.
-- Só ACRESCENTA uma coluna; todas as opções que já existem ficam "false" (como hoje).
alter table public.grupo_obrigatorio_opcoes
  add column if not exists nao_conta boolean not null default false;
