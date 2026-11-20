-- Quarto de Guerra: "A Vanessa orou por você" e "Mulheres orando com você"
alter table public.pedidos_oracao add column if not exists orado_em timestamptz;

create or replace function public.contar_turnos(dia text)
returns integer
language sql
security definer
set search_path = public
as $$
  select count(*)::int from public.progresso where dados -> 'turnos' ? dia;
$$;
revoke all on function public.contar_turnos(text) from public;
grant execute on function public.contar_turnos(text) to authenticated;
