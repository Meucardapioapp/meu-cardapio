-- =====================================================================
-- MeuCardapioApp: rodar SÓ NO DIA DE LANÇAR A VERSÃO NOVA
--
-- Ordem no dia: publicar o site novo → rodar 01 → rodar 05 → rodar este.
--
-- Os restaurantes que já usavam o sistema ganharam o teste grátis no dia
-- em que o SQL 01 foi rodado (em outubro). Se o lançamento for depois, o
-- teste deles já teria acabado e todos os cardápios sairiam do ar no dia.
-- Este arquivo dá 15 dias grátis contados A PARTIR DE HOJE para quem
-- ainda não assinou nenhum plano.
-- =====================================================================

update public.assinaturas
   set status = 'trial',
       acesso_ate = now() + interval '15 days',
       updated_at = now()
 where plano is null
   and status in ('trial', 'expirada');

-- Confere: quantos ficaram em teste e até quando.
select status, count(*) as restaurantes, min(acesso_ate)::date as ate
  from public.assinaturas
 group by status;
