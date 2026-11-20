-- Quarto de Guerra: tabelas e regras de segurança
-- Cole tudo no Supabase em: SQL Editor > New query > Run

-- 1. Lista de assinantes (a Kiwify vai atualizar automaticamente)
create table if not exists public.assinantes (
  email text primary key,
  status text not null default 'ativa' check (status in ('ativa','atrasada','cancelada')),
  pedido_kiwify text,
  atualizado timestamptz not null default now()
);

-- 2. Progresso de cada assinante (turnos, registros, pedidos, vitórias, aulas)
create table if not exists public.progresso (
  user_id uuid primary key references auth.users(id) on delete cascade,
  dados jsonb not null default '{}'::jsonb,
  atualizado timestamptz not null default now()
);

-- 3. Segurança: cada pessoa só enxerga o que é dela
alter table public.assinantes enable row level security;
alter table public.progresso enable row level security;

drop policy if exists "ver a propria assinatura" on public.assinantes;
create policy "ver a propria assinatura" on public.assinantes
  for select to authenticated
  using (email = lower(auth.jwt() ->> 'email'));

drop policy if exists "ver o proprio progresso" on public.progresso;
create policy "ver o proprio progresso" on public.progresso
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "criar o proprio progresso" on public.progresso;
create policy "criar o proprio progresso" on public.progresso
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "atualizar o proprio progresso" on public.progresso;
create policy "atualizar o proprio progresso" on public.progresso
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 4. Libera para o app apenas o necessário
grant select on public.assinantes to authenticated;
grant select, insert, update on public.progresso to authenticated;
