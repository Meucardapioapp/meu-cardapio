-- =====================================================================
-- MeuCardapioApp: SQL 19 — teste grátis conta a partir do PRIMEIRO acesso
--
-- Antes os 15 dias de teste contavam a partir do cadastro. Agora contam
-- a partir da primeira vez que o dono entra no painel.
--
-- * Nova coluna assinaturas.teste_iniciado_em (quando o teste começou).
-- * Quem já tem produtos cadastrados já está usando: marca o início no
--   cadastro da assinatura (created_at) e mantém o prazo atual.
-- * Quem ainda não tem produtos fica com a coluna vazia e ganha 15 dias
--   novos no próximo acesso ao painel.
--
-- Pode rodar mais de uma vez sem problema. Não apaga nenhum dado.
-- =====================================================================

alter table public.assinaturas
  add column if not exists teste_iniciado_em timestamptz;

-- Quem já tem produtos: o teste já começou (mantém o prazo atual).
update public.assinaturas a
   set teste_iniciado_em = a.created_at
 where a.teste_iniciado_em is null
   and exists (
     select 1 from public.produtos p
      where p.restaurante_id = a.restaurante_id
   );

-- Confere: quantos vão ganhar os 15 dias no próximo acesso ao painel.
select count(*) as vao_ganhar_15_dias_no_proximo_acesso
  from public.assinaturas
 where status = 'trial'
   and teste_iniciado_em is null;
