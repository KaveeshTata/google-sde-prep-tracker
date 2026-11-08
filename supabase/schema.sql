-- SWE Prep OS: minimal private workspace schema
-- Run in Supabase Dashboard > SQL Editor > New query.
create table if not exists public.user_workspace (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{"sessions":[],"problems":[],"done":{},"notes":{}}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_workspace enable row level security;

-- Users can only read/write their own single workspace row.
drop policy if exists "read own workspace" on public.user_workspace;
create policy "read own workspace" on public.user_workspace
  for select using (auth.uid() = user_id);
drop policy if exists "insert own workspace" on public.user_workspace;
create policy "insert own workspace" on public.user_workspace
  for insert with check (auth.uid() = user_id);
drop policy if exists "update own workspace" on public.user_workspace;
create policy "update own workspace" on public.user_workspace
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Optional private evidence bucket for a future upload UI. The current app stores evidence URLs.
insert into storage.buckets (id, name, public)
values ('prep-evidence', 'prep-evidence', false)
on conflict (id) do nothing;

drop policy if exists "user can upload own evidence" on storage.objects;
drop policy if exists "user can read own evidence" on storage.objects;
drop policy if exists "user can delete own evidence" on storage.objects;
create policy "user can upload own evidence" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'prep-evidence' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "user can read own evidence" on storage.objects
  for select to authenticated
  using (bucket_id = 'prep-evidence' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "user can delete own evidence" on storage.objects
  for delete to authenticated
  using (bucket_id = 'prep-evidence' and (storage.foldername(name))[1] = auth.uid()::text);
