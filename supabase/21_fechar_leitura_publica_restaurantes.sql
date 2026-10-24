-- =====================================================================
-- MeuCardapioApp: SQL 21 — fecha a leitura pública da tabela restaurantes
--
-- A auditoria (SQL 99) apontou: "Regra libera leitura de tabela privada
-- para todos" em restaurantes ("cardapio publico le restaurantes").
-- Essa regra foi reaberta pelo SQL 06, que era só para a versão ANTIGA do
-- site. Com ela, qualquer pessoa com a chave pública do site consegue
-- baixar os dados de todos os restaurantes (e-mail, WhatsApp e nome dos
-- donos, etc.).
--
-- A versão nova (a que está no ar) não precisa dessa regra:
--   * o cardápio público lê os restaurantes pelo servidor;
--   * o painel do dono lê e altera só a própria linha.
--
-- Este arquivo refaz SÓ a parte "restaurantes" do SQL 05:
--   1. o público deixa de ler a tabela;
--   2. o dono lê só o próprio restaurante;
--   3. o dono altera só o endereço e o Pixel (o resto passa pelo servidor).
--
-- Não apaga nenhum dado. Pode rodar mais de uma vez.
-- =====================================================================

do $$
declare
  pol record;
  colunas text;
begin
  -- Tira todas as regras atuais da tabela restaurantes
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'restaurantes' loop
    execute format('drop policy %I on public.restaurantes', pol.policyname);
  end loop;

  alter table public.restaurantes enable row level security;

  -- Dono lê só o próprio restaurante
  create policy "dono le o proprio restaurante" on public.restaurantes
    for select to authenticated
    using (auth_user_id = auth.uid());

  -- Dono altera só o próprio restaurante
  create policy "dono altera o proprio restaurante" on public.restaurantes
    for update to authenticated
    using (auth_user_id = auth.uid())
    with check (auth_user_id = auth.uid());

  -- Visitante sem login não acessa mais a tabela
  revoke all on public.restaurantes from anon;

  -- Logado: pode ler (só a própria linha, pela regra acima) e alterar só estas colunas
  revoke insert, update, delete, truncate, references, trigger on public.restaurantes from authenticated;
  grant select on public.restaurantes to authenticated;

  select string_agg(format('%I', column_name), ', ')
    into colunas
    from information_schema.columns
   where table_schema = 'public'
     and table_name = 'restaurantes'
     and column_name in ('cep', 'endereco', 'numero', 'bairro', 'cidade', 'estado',
                         'complemento', 'meta_pixel_id', 'latitude', 'longitude');

  if colunas is not null then
    execute format('grant update (%s) on public.restaurantes to authenticated', colunas);
  end if;
end $$;

-- Confere: precisa mostrar só as 2 regras do dono (nenhuma "cardapio publico").
select policyname, cmd, roles
  from pg_policies
 where schemaname = 'public' and tablename = 'restaurantes'
 order by policyname;
