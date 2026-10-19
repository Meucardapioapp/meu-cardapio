-- =====================================================================
-- MeuCardapioApp: funções novas (parte 8)
-- Só ACRESCENTA tabelas e colunas: pode rodar agora, mesmo com a versão
-- antiga no ar. Pode rodar mais de uma vez.
-- =====================================================================

do $$
declare
  tipo_restaurante text;
begin
  select format_type(a.atttypid, a.atttypmod) into tipo_restaurante
    from pg_attribute a
   where a.attrelid = 'public.restaurantes'::regclass and a.attname = 'id';

  -- Pausa de pedidos e tempos de entrega/retirada
  execute format($f$
    create table if not exists public.restaurante_operacao (
      restaurante_id %s primary key references public.restaurantes(id) on delete cascade,
      pausa_indefinida boolean not null default false,
      pausado_ate timestamptz,
      tempo_entrega_min integer check (tempo_entrega_min between 0 and 600),
      tempo_entrega_max integer check (tempo_entrega_max between 0 and 600),
      tempo_retirada integer check (tempo_retirada between 0 and 600),
      updated_at timestamptz not null default now()
    )$f$, tipo_restaurante);
end $$;

alter table public.restaurante_operacao enable row level security;
revoke all on public.restaurante_operacao from anon, authenticated;

-- Aceite dos termos de uso no cadastro
alter table public.restaurantes add column if not exists termos_aceitos_em timestamptz;

-- ---------------------------------------------------------------------
-- Produtos: promoção por dia/horário, estoque e "peça também"
-- ---------------------------------------------------------------------
alter table public.produtos add column if not exists promo_preco numeric(10,2);
alter table public.produtos add column if not exists promo_dias smallint[];
alter table public.produtos add column if not exists promo_inicio time;
alter table public.produtos add column if not exists promo_fim time;
alter table public.produtos add column if not exists estoque integer check (estoque is null or estoque >= 0);
alter table public.produtos add column if not exists sugerir_no_carrinho boolean not null default false;

-- Meio a meio: como cobrar quando o cliente escolhe mais de uma opção
alter table public.grupos_obrigatorios add column if not exists regra_preco text not null default 'soma';
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'grupos_obrigatorios_regra_preco_check') then
    alter table public.grupos_obrigatorios
      add constraint grupos_obrigatorios_regra_preco_check check (regra_preco in ('soma', 'maior', 'media'));
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 4. Conta (ou desconta) um pedido no histórico do cliente,
--    nos selos de fidelidade e no uso do cupom. Cada pedido conta
--    uma única vez, mesmo se a função for chamada de novo.
-- ---------------------------------------------------------------------
do $$
declare
  tipo_pedido text;
begin
  select format_type(a.atttypid, a.atttypmod) into tipo_pedido
    from pg_attribute a
   where a.attrelid = 'public.pedidos'::regclass and a.attname = 'id';

  execute format($f$
    create or replace function public.contabilizar_pedido(p_pedido %s, p_entrar boolean)
    returns void
    language plpgsql
    security definer
    set search_path = public
    as $fn$
    declare
      v_cliente text;
      v_restaurante text;
      v_total numeric;
      v_premio boolean;
      v_selo boolean;
      v_cupom uuid;
      v_ativo boolean;
      v_necessarios integer;
      v_cf bigint;
      v_selos integer;
      v_itens jsonb;
    begin
      if p_entrar then
        update public.pedidos
           set contabilizado = true
         where id = p_pedido and contabilizado = false
        returning cliente_id::text, restaurante_id::text, coalesce(total, 0),
                  usou_premio_fidelidade, cupom_id, itens::jsonb
          into v_cliente, v_restaurante, v_total, v_premio, v_cupom, v_itens;
      else
        update public.pedidos
           set contabilizado = false
         where id = p_pedido and contabilizado = true
        returning cliente_id::text, restaurante_id::text, coalesce(total, 0),
                  usou_premio_fidelidade, cupom_id, selo_concedido, itens::jsonb
          into v_cliente, v_restaurante, v_total, v_premio, v_cupom, v_selo, v_itens;
      end if;

      if not found then
        return;
      end if;

      if v_cupom is not null then
        update public.cupons
           set usos = greatest(usos + case when p_entrar then 1 else -1 end, 0)
         where id = v_cupom;
      end if;

      -- Estoque: baixa quando o pedido conta, devolve quando é cancelado.
      if v_itens is not null and jsonb_typeof(v_itens) = 'array' then
        update public.produtos p
           set estoque = greatest(p.estoque + case when p_entrar then -x.qtd else x.qtd end, 0)
          from (
            select item->>'id' as pid, sum(coalesce((item->>'quantity')::int, 1)) as qtd
              from jsonb_array_elements(v_itens) as item
             group by 1
          ) x
         where p.id::text = x.pid
           and p.estoque is not null;
      end if;

      if v_cliente is null then
        return;
      end if;

      update public.clientes
         set total_pedidos = greatest(coalesce(total_pedidos, 0) + case when p_entrar then 1 else -1 end, 0),
             total_gasto   = greatest(coalesce(total_gasto, 0) + case when p_entrar then v_total else -v_total end, 0),
             ultimo_pedido = case when p_entrar then now() else ultimo_pedido end
       where id::text = v_cliente;

      select ativo, greatest(coalesce(pedidos_necessarios, 10), 1)
        into v_ativo, v_necessarios
        from public.fidelidade
       where restaurante_id::text = v_restaurante
       order by updated_at desc nulls last
       limit 1;

      v_necessarios := coalesce(v_necessarios, 10);

      select id, selos into v_cf, v_selos
        from public.cliente_fidelidade
       where cliente_id::text = v_cliente and restaurante_id::text = v_restaurante
       order by id
       limit 1
       for update;

      if p_entrar then
        if v_premio then
          -- Usou o prêmio: gasta os selos do prêmio (sobra o que passou).
          if v_cf is not null then
            v_selos := greatest(coalesce(v_selos, 0) - v_necessarios, 0);
            update public.cliente_fidelidade
               set selos = v_selos,
                   desconto_disponivel = v_selos >= v_necessarios,
                   ultimo_resgate = now(),
                   updated_at = now()
             where id = v_cf;
          end if;
        elsif coalesce(v_ativo, false) then
          update public.pedidos set selo_concedido = true where id = p_pedido;

          if v_cf is null then
            execute 'insert into public.cliente_fidelidade (cliente_id, restaurante_id, selos, desconto_disponivel, updated_at)
                     select c.id, c.restaurante_id, 1, $1 <= 1, now() from public.clientes c where c.id::text = $2'
              using v_necessarios, v_cliente;
          else
            v_selos := coalesce(v_selos, 0) + 1;
            update public.cliente_fidelidade
               set selos = v_selos,
                   desconto_disponivel = v_selos >= v_necessarios,
                   updated_at = now()
             where id = v_cf;
          end if;
        end if;
      else
        if v_cf is not null then
          if v_premio then
            -- Pedido cancelado: devolve o prêmio ao cliente.
            v_selos := coalesce(v_selos, 0) + v_necessarios;
          elsif v_selo then
            v_selos := greatest(coalesce(v_selos, 0) - 1, 0);
          end if;

          update public.cliente_fidelidade
             set selos = v_selos,
                 desconto_disponivel = v_selos >= v_necessarios,
                 updated_at = now()
           where id = v_cf;
        end if;

        update public.pedidos set selo_concedido = false where id = p_pedido;
      end if;
    end
    $fn$
    $f$, tipo_pedido);
end $$;

do $$
declare
  assinatura text;
begin
  for assinatura in
    select p.oid::regprocedure::text
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'contabilizar_pedido'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', assinatura);
  end loop;
end $$;



-- =====================================================================
-- Pedido pela mesa (QR Code) e avaliações dos clientes
-- =====================================================================
alter table public.pedidos add column if not exists mesa text;

do $$
declare
  tipo_restaurante text;
begin
  select format_type(a.atttypid, a.atttypmod) into tipo_restaurante
    from pg_attribute a
   where a.attrelid = 'public.restaurantes'::regclass and a.attname = 'id';

  execute format($f$
    create table if not exists public.avaliacoes (
      id uuid primary key default gen_random_uuid(),
      restaurante_id %s not null references public.restaurantes(id) on delete cascade,
      pedido_id text not null unique,
      nota smallint not null check (nota between 1 and 5),
      comentario text check (comentario is null or char_length(comentario) <= 300),
      nome text,
      visivel boolean not null default true,
      created_at timestamptz not null default now()
    )$f$, tipo_restaurante);
end $$;

create index if not exists avaliacoes_restaurante_idx
  on public.avaliacoes (restaurante_id, created_at desc);

alter table public.avaliacoes enable row level security;
revoke all on public.avaliacoes from anon, authenticated;

-- =====================================================================
-- Equipe: atendentes com acesso só aos pedidos
-- =====================================================================
do $$
declare
  tipo_restaurante text;
begin
  select format_type(a.atttypid, a.atttypmod) into tipo_restaurante
    from pg_attribute a
   where a.attrelid = 'public.restaurantes'::regclass and a.attname = 'id';

  execute format($f$
    create table if not exists public.equipe (
      id uuid primary key default gen_random_uuid(),
      restaurante_id %s not null references public.restaurantes(id) on delete cascade,
      auth_user_id uuid not null unique,
      nome text not null check (char_length(nome) between 1 and 60),
      email text not null,
      papel text not null default 'atendente' check (papel in ('atendente')),
      ativo boolean not null default true,
      created_at timestamptz not null default now()
    )$f$, tipo_restaurante);
end $$;

create index if not exists equipe_restaurante_idx on public.equipe (restaurante_id);
alter table public.equipe enable row level security;
revoke all on public.equipe from anon, authenticated;

-- =====================================================================
-- Avisos: notificação no celular do restaurante, WhatsApp automático
-- para o cliente e controle dos e-mails já enviados
-- =====================================================================
do $$
declare
  tipo_restaurante text;
begin
  select format_type(a.atttypid, a.atttypmod) into tipo_restaurante
    from pg_attribute a
   where a.attrelid = 'public.restaurantes'::regclass and a.attname = 'id';

  execute format($f$
    create table if not exists public.push_inscricoes (
      id uuid primary key default gen_random_uuid(),
      restaurante_id %s not null references public.restaurantes(id) on delete cascade,
      auth_user_id uuid not null,
      endpoint text not null unique check (char_length(endpoint) <= 1000),
      p256dh text not null check (char_length(p256dh) <= 200),
      auth text not null check (char_length(auth) <= 100),
      aparelho text,
      created_at timestamptz not null default now()
    )$f$, tipo_restaurante);

  execute format($f$
    create table if not exists public.avisos_enviados (
      id bigserial primary key,
      restaurante_id %s not null references public.restaurantes(id) on delete cascade,
      tipo text not null,
      referencia text not null,
      created_at timestamptz not null default now(),
      unique (restaurante_id, tipo, referencia)
    )$f$, tipo_restaurante);
end $$;

create index if not exists push_inscricoes_restaurante_idx on public.push_inscricoes (restaurante_id);
alter table public.push_inscricoes enable row level security;
revoke all on public.push_inscricoes from anon, authenticated;
alter table public.avisos_enviados enable row level security;
revoke all on public.avisos_enviados from anon, authenticated;

alter table public.restaurante_operacao add column if not exists whatsapp_cliente boolean not null default false;
