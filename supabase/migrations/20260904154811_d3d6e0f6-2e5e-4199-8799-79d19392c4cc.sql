create table if not exists public.roots_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  root_id text not null references public.roots_content(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, root_id)
);
grant select, insert, delete on public.roots_saves to authenticated;
grant all on public.roots_saves to service_role;
alter table public.roots_saves enable row level security;
create policy "Members can view their saved roots" on public.roots_saves for select to authenticated using (auth.uid() = user_id);
create policy "Members can save roots" on public.roots_saves for insert to authenticated with check (auth.uid() = user_id);
create policy "Members can remove saved roots" on public.roots_saves for delete to authenticated using (auth.uid() = user_id);