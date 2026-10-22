-- =====================================================================
-- MeuCardapioApp: SQL 20 — teste grátis recomeça para TODOS no 1º acesso
-- (rodar DEPOIS do SQL 19 e ANTES do git push da versão nova)
--
-- Regra: todo restaurante que está no teste grátis e nunca pagou ganha
-- 15 dias contados a partir do PRIMEIRO acesso ao painel depois da
-- atualização — tenha ele criado o cardápio inteiro na versão antiga ou
-- não feito nada. Inclui quem já estava com o teste vencido.
--
-- Como funciona: deixa teste_iniciado_em vazio para essas pessoas.
-- No primeiro acesso, o sistema marca o início e dá os 15 dias.
--
-- Não mexe em quem é assinante, já pagou alguma vez ou cancelou.
-- Não apaga nenhum dado.
-- =====================================================================

update public.assinaturas a
   set teste_iniciado_em = null,
       status = 'trial',
       updated_at = now()
 where a.status in ('trial', 'expirada')
   -- só quem ainda não começou o teste na versão nova
   -- (vazio ou marcado pelo SQL 19 com a data do cadastro)
   and (a.teste_iniciado_em is null or a.teste_iniciado_em = a.created_at)
   -- nunca pagou o plano
   and not exists (
     select 1 from public.pagamentos_assinatura pg
      where pg.restaurante_id = a.restaurante_id
        and pg.status = 'paid'
   );

-- Confere: quantos vão ganhar os 15 dias no próximo acesso ao painel.
select count(*) as vao_ganhar_15_dias_no_proximo_acesso
  from public.assinaturas
 where status = 'trial'
   and teste_iniciado_em is null;
