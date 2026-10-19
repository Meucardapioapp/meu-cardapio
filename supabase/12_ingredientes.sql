-- =====================================================================
-- MeuCardapioApp: ingredientes nos adicionais e nas opções (parte 12)
-- Só ACRESCENTA colunas: pode rodar agora, mesmo com a versão antiga no
-- ar. Pode rodar mais de uma vez.
-- =====================================================================

-- Ingredientes/descrição de cada adicional (ex.: "bacon em cubos, cheddar")
alter table public.adicionais add column if not exists descricao text;

-- As opções dos itens obrigatórios (ex.: sabores) já tinham descrição;
-- garante a coluna caso algum banco não tenha.
alter table public.grupo_obrigatorio_opcoes add column if not exists descricao text;
