-- 28 · Índices de desempenho (reduz CPU de consulta no Supabase)
-- SEGURO: só CRIA índices (IF NOT EXISTS). Não altera nem apaga dados.
-- No volume atual a criação é instantânea. Rollback no fim do arquivo.

-- Pedidos: filtrados por restaurante e ordenados por data (painel, relatórios)
create index if not exists idx_pedidos_restaurante_data
  on public.pedidos (restaurante_id, created_at desc);
create index if not exists idx_pedidos_cliente
  on public.pedidos (cliente_id);

-- Produtos: cardápio filtra por restaurante + ativo, ordena por ordem
create index if not exists idx_produtos_restaurante_ativo
  on public.produtos (restaurante_id, ativo);

-- Categorias, taxas e opções: busca por restaurante/produto
create index if not exists idx_categorias_restaurante on public.categorias (restaurante_id);
create index if not exists idx_bairros_restaurante on public.bairros_entrega (restaurante_id);
create index if not exists idx_adicionais_produto on public.adicionais (produto_id);
create index if not exists idx_grupos_produto on public.grupos_obrigatorios (produto_id);

-- Clientes: login/identificação
create index if not exists idx_clientes_rest_tel on public.clientes (restaurante_id, telefone);
create index if not exists idx_clientes_token on public.clientes (token_acesso);
create index if not exists idx_enderecos_cliente on public.enderecos_cliente (cliente_id);

-- ROLLBACK (se precisar desfazer):
-- drop index if exists idx_pedidos_restaurante_data;
-- drop index if exists idx_pedidos_cliente;
-- drop index if exists idx_produtos_restaurante_ativo;
-- drop index if exists idx_categorias_restaurante;
-- drop index if exists idx_bairros_restaurante;
-- drop index if exists idx_adicionais_produto;
-- drop index if exists idx_grupos_produto;
-- drop index if exists idx_clientes_rest_tel;
-- drop index if exists idx_clientes_token;
-- drop index if exists idx_enderecos_cliente;
