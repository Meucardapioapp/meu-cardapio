-- =====================================================================
-- MeuCardapioApp: blindagem do banco (parte 5)
--
-- ATENÇÃO À ORDEM:
--   1) Publique primeiro a versão nova do site (Vercel).
--   2) Depois rode este arquivo no Supabase → SQL Editor → Run.
-- (O site novo já lê os dados públicos pela vista "restaurantes_publico".)
--
-- O que faz:
--   1. Esconde e-mail, nome do responsável, telefone pessoal e outros
--      dados internos dos restaurantes (antes qualquer pessoa conseguia
--      baixar a lista de todos os donos com a chave pública do site).
--   2. O dono só consegue alterar as colunas permitidas do restaurante
--      (endereço e Pixel), nunca o dono da conta, o link ou o e-mail.
--   3. Liga a proteção (RLS) em TODAS as tabelas que ainda estavam sem.
--   4. Tira do navegador o acesso a funções "security definer".
--   5. Fotos: só imagens de até 5 MB, cada restaurante só mexe nas suas.
--   6. Função para conferir a senha antes de ações de dinheiro.
--   7. Trava de 24 h para saque depois de trocar a conta bancária.
--
-- Pode rodar mais de uma vez. No final aparece um resumo (NOTICE).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Dados públicos dos restaurantes pela vista "restaurantes_publico"
-- ---------------------------------------------------------------------
do $$
declare
  colunas text;
  pol record;
begin
  -- Tudo o que NÃO pode aparecer para o público.
  select string_agg(format('%I', column_name), ', ' order by ordinal_position)
    into colunas
    from information_schema.columns
   where table_schema = 'public'
     and table_name = 'restaurantes'
     and column_name !~* '(auth_user|e_?mail|responsavel|telefone|celular|cpf|cnpj|documento|banco|agencia|conta|digito|recipient|pagarme|asaas|stripe|mercado|senha|password|token|secret|segredo|chave|api_?key|premium|assinatura|plano|trial|ip_)';

  execute 'drop view if exists public.restaurantes_publico';
  execute format(
    'create view public.restaurantes_publico with (security_barrier = true) as select %s from public.restaurantes',
    colunas
  );
  -- O Supabase dá permissão total ao visitante em toda vista nova: tira tudo e libera só a leitura.
  execute 'revoke all on public.restaurantes_publico from public, anon, authenticated';
  execute 'grant select on public.restaurantes_publico to anon, authenticated';

  -- Tabela original: o público não lê mais; o dono lê só a própria linha.
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'restaurantes' loop
    execute format('drop policy %I on public.restaurantes', pol.policyname);
  end loop;

  alter table public.restaurantes enable row level security;

  create policy "dono le o proprio restaurante" on public.restaurantes
    for select to authenticated
    using (auth_user_id = auth.uid());

  create policy "dono altera o proprio restaurante" on public.restaurantes
    for update to authenticated
    using (auth_user_id = auth.uid())
    with check (auth_user_id = auth.uid());

  revoke all on public.restaurantes from anon;
  revoke insert, update, delete, truncate, references, trigger on public.restaurantes from authenticated;
  grant select on public.restaurantes to authenticated;

  -- O dono só pode alterar estas colunas pelo navegador
  -- (o resto passa pelo servidor, que confere tudo).
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

-- ---------------------------------------------------------------------
-- 2. RLS em todas as tabelas. Tabelas que o navegador não usa ficam
--    só para o servidor (a chave secreta do servidor continua lendo tudo).
-- ---------------------------------------------------------------------
do $$
declare
  usadas_no_navegador text[] := array[
    'restaurantes', 'pedidos', 'aparencia', 'categorias', 'produtos', 'products',
    'adicionais', 'grupos_obrigatorios', 'grupo_obrigatorio_opcoes',
    'bairros_entrega', 'configuracoes_pagamento', 'fidelidade', 'banners', 'logos'
  ];
  t record;
  ligadas text[] := '{}';
  fechadas text[] := '{}';
begin
  for t in
    select c.relname, c.relrowsecurity
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'p')
  loop
    if not t.relrowsecurity then
      execute format('alter table public.%I enable row level security', t.relname);
      ligadas := ligadas || t.relname::text;
    end if;

    if not (t.relname = any (usadas_no_navegador)) then
      execute format('revoke all on public.%I from anon, authenticated', t.relname);
      fechadas := fechadas || t.relname::text;
    end if;
  end loop;

  -- Pedidos: o navegador do dono só lê (o resto é pelo servidor).
  revoke insert, update, delete, truncate on public.pedidos from anon, authenticated;
  revoke all on public.pedidos from anon;

  raise notice 'RLS ligado agora em: %', ligadas;
  raise notice 'Tabelas só do servidor: %', fechadas;
end $$;

-- Vistas (views) ignoram o RLS de quem consulta: só a vista pública fica aberta.
do $$
declare
  v record;
  fechadas text[] := '{}';
begin
  for v in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('v', 'm')
       and c.relname <> 'restaurantes_publico'
  loop
    execute format('revoke all on public.%I from anon, authenticated', v.relname);
    fechadas := fechadas || v.relname::text;
  end loop;
  raise notice 'Vistas fechadas para o navegador: %', fechadas;
end $$;

-- ---------------------------------------------------------------------
-- 3. Funções "security definer" (rodam com poder total): o navegador
--    não pode chamar nenhuma, a não ser a usada pelas regras do dono.
-- ---------------------------------------------------------------------
do $$
declare
  f record;
  fechadas text[] := '{}';
begin
  for f in
    select p.oid::regprocedure::text as assinatura, p.proname
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prosecdef
  loop
    execute format('revoke all on function %s from public, anon', f.assinatura);
    if f.proname <> 'meus_restaurantes' then
      execute format('revoke all on function %s from authenticated', f.assinatura);
    else
      execute format('grant execute on function %s to authenticated', f.assinatura);
    end if;
    fechadas := fechadas || f.proname::text;
  end loop;
  raise notice 'Funções protegidas: %', fechadas;
end $$;

-- ---------------------------------------------------------------------
-- 4. Conferir a senha do dono (usado antes de trocar conta bancária e
--    de sacar). Só o servidor chama. Compara com o hash (bcrypt) do Auth.
-- ---------------------------------------------------------------------
create or replace function public.conferir_senha_usuario(p_user uuid, p_senha text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions, auth
as $fn$
declare
  v_hash text;
begin
  if p_user is null or p_senha is null or length(p_senha) < 1 or length(p_senha) > 200 then
    return false;
  end if;

  select encrypted_password into v_hash from auth.users where id = p_user;

  if v_hash is null or v_hash = '' then
    return false;
  end if;

  return v_hash = crypt(p_senha, v_hash);
end
$fn$;

revoke all on function public.conferir_senha_usuario(uuid, text) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.conferir_senha_usuario(uuid, text) to service_role';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 5. Trava de saque depois de trocar a conta bancária
-- ---------------------------------------------------------------------
alter table public.restaurantes_financeiro
  add column if not exists conta_alterada_em timestamptz;

-- ---------------------------------------------------------------------
-- 6. Clientes: um telefone por restaurante (evita "sequestro" de conta)
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from public.clientes
     where telefone is not null
     group by restaurante_id, telefone
    having count(*) > 1
  ) then
    create unique index if not exists clientes_restaurante_telefone_key
      on public.clientes (restaurante_id, telefone);
  else
    raise notice 'Há clientes com telefone repetido no mesmo restaurante: índice único não criado (o servidor já impede novos repetidos).';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 7. Fotos (Storage): só imagens, até 5 MB, cada restaurante na sua pasta
-- ---------------------------------------------------------------------
do $$
declare
  pol record;
  outros text[];
begin
  if to_regclass('storage.buckets') is null then
    raise notice 'Storage não encontrado: parte 7 ignorada.';
    return;
  end if;

  update storage.buckets
     set public = true,
         file_size_limit = 5 * 1024 * 1024,
         allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
   where id in ('products', 'banners', 'logos');

  select array_agg(id) into outros from storage.buckets where id not in ('products', 'banners', 'logos');

  -- Apaga as regras antigas que mexem com as nossas pastas (ou com todas).
  for pol in
    select policyname, coalesce(qual, '') || ' ' || coalesce(with_check, '') as regra
      from pg_policies
     where schemaname = 'storage' and tablename = 'objects'
  loop
    if pol.regra ~ '(products|banners|logos)' or pol.regra !~ 'bucket_id' then
      execute format('drop policy %I on storage.objects', pol.policyname);
    end if;
  end loop;

  create policy "fotos do cardapio sao publicas" on storage.objects
    for select using (bucket_id in ('products', 'banners', 'logos'));

  create policy "dono envia fotos na propria pasta" on storage.objects
    for insert to authenticated
    with check (
      bucket_id in ('products', 'banners', 'logos')
      and (storage.foldername(name))[1] in (select public.meus_restaurantes()::text)
    );

  create policy "dono altera fotos da propria pasta" on storage.objects
    for update to authenticated
    using (
      bucket_id in ('products', 'banners', 'logos')
      and (storage.foldername(name))[1] in (select public.meus_restaurantes()::text)
    )
    with check (
      bucket_id in ('products', 'banners', 'logos')
      and (storage.foldername(name))[1] in (select public.meus_restaurantes()::text)
    );

  create policy "dono apaga fotos da propria pasta" on storage.objects
    for delete to authenticated
    using (
      bucket_id in ('products', 'banners', 'logos')
      and (storage.foldername(name))[1] in (select public.meus_restaurantes()::text)
    );

  if outros is not null then
    raise notice 'Outros buckets encontrados (regras com bucket_id próprio foram mantidas): %', outros;
  end if;
exception
  when others then
    raise notice 'Não foi possível ajustar o Storage pelo SQL (%). Faça a parte 7 pelo painel (veja o LEIA-ME).', sqlerrm;
end $$;
