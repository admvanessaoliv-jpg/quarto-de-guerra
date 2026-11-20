-- Quarto de Guerra: pedidos de oração ("A Vanessa ora por você")
-- Cole no Supabase em: SQL Editor > New query > Run

create table if not exists public.pedidos_oracao (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  email text,
  nome text,
  pedido text not null check (char_length(pedido) <= 1500),
  citar_nome boolean not null default false,
  orado boolean not null default false,
  criado timestamptz not null default now()
);

alter table public.pedidos_oracao enable row level security;

drop policy if exists "enviar o proprio pedido" on public.pedidos_oracao;
create policy "enviar o proprio pedido" on public.pedidos_oracao
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "ver pedidos" on public.pedidos_oracao;
create policy "ver pedidos" on public.pedidos_oracao
  for select to authenticated
  using (user_id = auth.uid() or lower(auth.jwt() ->> 'email') = 'contato.oracaoegratidao@gmail.com');

drop policy if exists "vanessa marca como orado" on public.pedidos_oracao;
create policy "vanessa marca como orado" on public.pedidos_oracao
  for update to authenticated
  using (lower(auth.jwt() ->> 'email') = 'contato.oracaoegratidao@gmail.com')
  with check (lower(auth.jwt() ->> 'email') = 'contato.oracaoegratidao@gmail.com');

grant select, insert, update on public.pedidos_oracao to authenticated;

grant select, insert, update, delete on public.pedidos_oracao to service_role;
