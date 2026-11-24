-- =====================================================================
-- 29 · PAGAMENTO DIVIDIDO (mais de uma forma de pagamento no mesmo pedido)
--
-- O cliente pode dividir o total entre as formas que o restaurante aceita
-- (ex.: R$50 no Pix online + R$50 em dinheiro na entrega).
--
-- SEGURANCA: só ADICIONA colunas, com valor padrão. NÃO altera dados
-- existentes, NÃO apaga nada. Pedidos antigos continuam funcionando
-- (pagamento_dividido = false, pagamentos = null).
-- Como rodar: Supabase -> SQL Editor -> cole tudo -> Run.
-- =====================================================================

alter table public.pedidos
  add column if not exists pagamento_dividido boolean not null default false;

-- Lista das parcelas: [{"metodo":"pix","valor":50},{"metodo":"cash","valor":50}]
-- metodo ∈ pix (Pix online), pix_chave, card_delivery, cash
alter table public.pedidos
  add column if not exists pagamentos jsonb;

-- Quanto desse pedido é cobrado ONLINE via Pix (Pagar.me). Null quando não há
-- parte online. É o valor que o QR do Pix cobra (em vez do total).
alter table public.pedidos
  add column if not exists valor_online numeric(10,2);

-- =====================================================================
-- ROLLBACK (desfazer, se precisar):
--   alter table public.pedidos drop column if exists pagamento_dividido;
--   alter table public.pedidos drop column if exists pagamentos;
--   alter table public.pedidos drop column if exists valor_online;
-- =====================================================================
