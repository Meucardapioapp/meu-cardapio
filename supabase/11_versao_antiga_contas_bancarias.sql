-- =====================================================================
-- MeuCardapioApp: contas bancárias na VERSÃO ANTIGA (parte 11)
--
-- Problema: o painel antigo só libera "Taxa de entrega", "Formas de
-- pagamento" e "Link do cardápio" se achar banco, agência, conta e CPF na
-- tabela restaurantes. O SQL 01 moveu esses dados para a tabela protegida
-- (restaurantes_financeiro, criptografada), então a versão antiga passou a
-- pedir a conta bancária de novo.
--
-- O que este arquivo faz (só para quem já tinha conta cadastrada):
--   * devolve o BANCO, o TIPO DE CONTA e o RECEBEDOR da Pagar.me;
--   * no CPF/CNPJ, na agência e na conta coloca o marcador "•••"
--     (protegido). O dado real continua só na tabela criptografada.
--
-- Não apaga nem altera nada na tabela protegida. Pode rodar mais de uma
-- vez. No dia do lançamento, o SQL 01 limpa esses campos de novo e ignora
-- o marcador (o dado real nunca é trocado por "•••").
-- =====================================================================

do $$
declare
  faltando text[];
  atualizados integer;
begin
  select array_agg(c) into faltando
    from unnest(array['cpf_cnpj','banco','agencia','conta','tipo_conta','pagarme_recipient_id','pagarme_status']) c
   where not exists (
     select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'restaurantes' and column_name = c
   );

  if faltando is not null then
    raise notice 'Colunas que não existem em restaurantes (ignorado): %', faltando;
    return;
  end if;

  if to_regclass('public.restaurantes_financeiro') is null then
    raise notice 'Tabela restaurantes_financeiro não existe: nada a fazer.';
    return;
  end if;

  update public.restaurantes r
     set cpf_cnpj   = coalesce(nullif(r.cpf_cnpj::text, ''), '•••••••••••'),
         banco      = coalesce(nullif(r.banco::text, ''), f.banco),
         agencia    = coalesce(nullif(r.agencia::text, ''), '•••'),
         conta      = coalesce(nullif(r.conta::text, ''), '•••'),
         tipo_conta = coalesce(nullif(r.tipo_conta::text, ''), f.tipo_conta, 'corrente'),
         pagarme_recipient_id = coalesce(nullif(r.pagarme_recipient_id::text, ''), f.pagarme_recipient_id),
         pagarme_status       = coalesce(nullif(r.pagarme_status::text, ''), f.pagarme_status)
    from public.restaurantes_financeiro f
   where f.restaurante_id = r.id
     and coalesce(f.cpf_cnpj, '') <> ''
     and coalesce(f.banco, '') <> ''
     and coalesce(f.agencia, '') <> ''
     and coalesce(f.conta, '') <> '';

  get diagnostics atualizados = row_count;
  raise notice 'Restaurantes com conta bancária devolvida à versão antiga: %', atualizados;
end $$;
