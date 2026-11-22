-- 26 · Complementos grátis no total (ex.: açaí 300ml com 3 complementos)
-- Só ACRESCENTA duas colunas vazias em "produtos". Não apaga nem muda nada:
-- produto com as colunas vazias continua funcionando exatamente como hoje.
alter table public.produtos
  add column if not exists complementos_gratis integer,
  add column if not exists preco_complemento_extra numeric(10,2);

alter table public.produtos drop constraint if exists produtos_complementos_gratis_ok;
alter table public.produtos
  add constraint produtos_complementos_gratis_ok
  check (
    (complementos_gratis is null or complementos_gratis between 0 and 99)
    and (preco_complemento_extra is null or preco_complemento_extra >= 0)
  );
