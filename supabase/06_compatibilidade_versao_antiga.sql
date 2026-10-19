-- =====================================================================
-- MeuCardapioApp: compatibilidade com a VERSÃO ANTIGA que está no ar
--
-- Use enquanto o site da Vercel ainda for a versão antiga.
-- Os SQLs 01 a 05 foram feitos para a versão nova; a antiga lê direto
-- a tabela "restaurantes", muda o status do pedido pelo navegador,
-- envia fotos sem pasta e lê o recebedor Pix na tabela restaurantes.
-- Este arquivo devolve SÓ isso. O resto da proteção continua.
--
-- QUANDO PUBLICAR A VERSÃO NOVA: rode de novo o 01 e depois o 05.
-- (Eles fecham tudo de novo e movem os dados bancários de volta.)
--
-- Pode rodar mais de uma vez.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Cardápio público volta a ler a tabela restaurantes
-- ---------------------------------------------------------------------
do $$
declare
  pol record;
begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'restaurantes' loop
    execute format('drop policy %I on public.restaurantes', pol.policyname);
  end loop;

  create policy "cardapio publico le restaurantes" on public.restaurantes
    for select using (true);

  create policy "dono altera o proprio restaurante" on public.restaurantes
    for update to authenticated
    using (auth_user_id = auth.uid())
    with check (auth_user_id = auth.uid());

  grant select on public.restaurantes to anon, authenticated;
  grant update on public.restaurantes to authenticated;
end $$;

-- ---------------------------------------------------------------------
-- 2. Pix da versão antiga: o ID do recebedor volta para restaurantes
--    (só o ID e o status; CPF e conta continuam guardados à parte)
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'restaurantes'
                and column_name = 'pagarme_recipient_id') then
    update public.restaurantes r
       set pagarme_recipient_id = f.pagarme_recipient_id
      from public.restaurantes_financeiro f
     where f.restaurante_id = r.id
       and f.pagarme_recipient_id is not null
       and r.pagarme_recipient_id is distinct from f.pagarme_recipient_id;
  end if;

  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'restaurantes'
                and column_name = 'pagarme_status') then
    update public.restaurantes r
       set pagarme_status = f.pagarme_status
      from public.restaurantes_financeiro f
     where f.restaurante_id = r.id
       and f.pagarme_status is not null
       and r.pagarme_status is distinct from f.pagarme_status;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 3. Painel antigo: dono muda o STATUS dos próprios pedidos
-- ---------------------------------------------------------------------
drop policy if exists "dono altera status dos proprios pedidos" on public.pedidos;
create policy "dono altera status dos proprios pedidos" on public.pedidos
  for update to authenticated
  using (restaurante_id in (select public.meus_restaurantes()))
  with check (restaurante_id in (select public.meus_restaurantes()));

grant select on public.pedidos to authenticated;
grant update (status) on public.pedidos to authenticated;

-- ---------------------------------------------------------------------
-- 4. Tela de clientes antiga: o dono vê só os próprios clientes
-- ---------------------------------------------------------------------
drop policy if exists "dono le os proprios clientes" on public.clientes;
create policy "dono le os proprios clientes" on public.clientes
  for select to authenticated
  using (restaurante_id in (select public.meus_restaurantes()));
grant select on public.clientes to authenticated;

do $$
begin
  if to_regclass('public.cliente_fidelidade') is not null then
    execute 'drop policy if exists "dono le a fidelidade dos proprios clientes" on public.cliente_fidelidade';
    execute 'create policy "dono le a fidelidade dos proprios clientes" on public.cliente_fidelidade
               for select to authenticated
               using (restaurante_id in (select public.meus_restaurantes()))';
    execute 'grant select on public.cliente_fidelidade to authenticated';
  end if;

  if to_regclass('public.vw_clientes_admin') is not null then
    execute 'alter view public.vw_clientes_admin set (security_invoker = true)';
    execute 'grant select on public.vw_clientes_admin to authenticated';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 5. Fotos: a versão antiga envia sem pasta. Libera envio para quem
--    está logado (só imagens até 5 MB continuam valendo).
-- ---------------------------------------------------------------------
do $$
begin
  if to_regclass('storage.objects') is null then
    return;
  end if;

  drop policy if exists "versao antiga envia fotos" on storage.objects;
  create policy "versao antiga envia fotos" on storage.objects
    for insert to authenticated
    with check (bucket_id in ('products', 'banners', 'logos'));
exception
  when others then
    raise notice 'Não foi possível ajustar o Storage pelo SQL (%).', sqlerrm;
end $$;
