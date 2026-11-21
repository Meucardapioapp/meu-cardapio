-- =====================================================================
-- MeuCardapioApp: SQL 25 — desligar Pix online e retirada
--
-- O dono pode desligar o Pix online (sem apagar os dados bancários) e
-- marcar "Só trabalho com delivery" (o cardápio não oferece retirada).
-- Os dois começam ligados, então nada muda para quem não mexer.
--
-- Não apaga nenhum dado. Pode rodar mais de uma vez.
-- =====================================================================

alter table public.configuracoes_pagamento
  add column if not exists pix_online boolean not null default true;

alter table public.configuracoes_pagamento
  add column if not exists retirada boolean not null default true;

-- Confere: precisa mostrar 2 linhas.
select column_name, data_type, column_default
  from information_schema.columns
 where table_schema = 'public'
   and table_name = 'configuracoes_pagamento'
   and column_name in ('pix_online', 'retirada');
