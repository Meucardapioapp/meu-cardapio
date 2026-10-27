-- =====================================================================
-- MeuCardapioApp: SQL 22 — cardápio de demonstração sempre no ar
--
-- A "fornadapizzaria" é o cardápio de teste do próprio MeuCardápioApp
-- (o link "Ver demonstração" do site). Aqui ela vira assinante permanente
-- (acesso até 2099), sem cobrança no cartão, para nunca sair do ar.
-- O código novo também a tira das contas do Painel da plataforma.
--
-- Não apaga nenhum dado. Pode rodar mais de uma vez.
-- =====================================================================

update public.assinaturas a
   set status = 'ativa',
       plano = 'mensal',
       metodo = null,
       acesso_ate = '2099-12-31T23:59:59Z',
       pagarme_subscription_id = null,
       cartao_final = null,
       cartao_bandeira = null,
       updated_at = now()
  from public.restaurantes r
 where r.id = a.restaurante_id
   and r.slug = 'fornadapizzaria';

-- Confere: precisa mostrar 1 linha, status "ativa" até 2099.
select r.slug, a.status, a.acesso_ate
  from public.assinaturas a
  join public.restaurantes r on r.id = a.restaurante_id
 where r.slug = 'fornadapizzaria';
