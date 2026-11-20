-- Quarto de Guerra: Vitórias da comunidade
create table if not exists public.testemunhos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text,
  texto text not null check (char_length(texto) <= 800),
  aprovado boolean not null default false,
  criado timestamptz not null default now()
);
alter table public.testemunhos enable row level security;
drop policy if exists "enviar vitoria" on public.testemunhos;
create policy "enviar vitoria" on public.testemunhos for insert to authenticated with check (user_id = auth.uid() and aprovado = false);
drop policy if exists "ver vitorias" on public.testemunhos;
create policy "ver vitorias" on public.testemunhos for select to authenticated
  using (aprovado or user_id = auth.uid() or lower(auth.jwt() ->> 'email') = 'contato.oracaoegratidao@gmail.com');
drop policy if exists "vanessa aprova" on public.testemunhos;
create policy "vanessa aprova" on public.testemunhos for update to authenticated
  using (lower(auth.jwt() ->> 'email') = 'contato.oracaoegratidao@gmail.com') with check (lower(auth.jwt() ->> 'email') = 'contato.oracaoegratidao@gmail.com');
drop policy if exists "vanessa apaga" on public.testemunhos;
create policy "vanessa apaga" on public.testemunhos for delete to authenticated
  using (lower(auth.jwt() ->> 'email') = 'contato.oracaoegratidao@gmail.com');
grant select, insert, update, delete on public.testemunhos to authenticated;
grant select, insert, update, delete on public.testemunhos to service_role;
