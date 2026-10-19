-- =====================================================================
-- MeuCardapioApp: limite de tentativas (rate limit) — parte 3
--
-- Guarda no banco quantas vezes cada IP/e-mail chamou uma ação
-- sensível (cadastro, login do cliente, pedido, Pix...). Assim o limite
-- vale para todos os servidores da Vercel ao mesmo tempo.
-- Pode rodar mais de uma vez.
-- =====================================================================

create table if not exists public.limites_tentativas (
  chave text primary key,          -- ex.: "cadastro:<hash do IP>"
  inicio timestamptz not null default now(),
  total integer not null default 0
);

alter table public.limites_tentativas enable row level security;
revoke all on public.limites_tentativas from anon, authenticated;

-- Registra uma tentativa e diz se ainda está dentro do limite.
create or replace function public.registrar_tentativa(
  p_chave text,
  p_maximo integer,
  p_janela_segundos integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  atual integer;
begin
  insert into public.limites_tentativas as l (chave, inicio, total)
  values (p_chave, now(), 1)
  on conflict (chave) do update
    set total  = case when l.inicio < now() - make_interval(secs => p_janela_segundos)
                      then 1 else l.total + 1 end,
        inicio = case when l.inicio < now() - make_interval(secs => p_janela_segundos)
                      then now() else l.inicio end
  returning total into atual;

  -- Limpeza ocasional de registros velhos (1 em cada 200 chamadas).
  if random() < 0.005 then
    delete from public.limites_tentativas where inicio < now() - interval '1 day';
  end if;

  return atual <= p_maximo;
end
$$;

revoke all on function public.registrar_tentativa(text, integer, integer) from public, anon, authenticated;
