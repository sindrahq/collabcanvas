-- Setup for username-based workspace invites.
-- Run this in Supabase SQL Editor.

create extension if not exists citext;

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username citext not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_profiles_username_format check (username::text ~ '^[a-z0-9_]{3,30}$')
);

create unique index if not exists user_profiles_username_unique
  on public.user_profiles (lower(username::text));

-- Backfill usernames from existing auth metadata when possible.
insert into public.user_profiles (user_id, username)
select
  u.id,
  lower(trim(u.raw_user_meta_data ->> 'username'))
from auth.users u
where coalesce(trim(u.raw_user_meta_data ->> 'username'), '') <> ''
  and lower(trim(u.raw_user_meta_data ->> 'username')) ~ '^[a-z0-9_]{3,30}$'
on conflict (user_id) do update
set username = excluded.username,
    updated_at = now();

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.user_profiles to authenticated;

alter table public.user_profiles enable row level security;

drop policy if exists "user_profiles_select_authenticated" on public.user_profiles;
drop policy if exists "user_profiles_insert_own" on public.user_profiles;
drop policy if exists "user_profiles_update_own" on public.user_profiles;
drop policy if exists "user_profiles_delete_own" on public.user_profiles;

create policy "user_profiles_select_authenticated"
on public.user_profiles
for select
to authenticated
using (true);

create policy "user_profiles_insert_own"
on public.user_profiles
for insert
to authenticated
with check (user_id = auth.uid());

create policy "user_profiles_update_own"
on public.user_profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "user_profiles_delete_own"
on public.user_profiles
for delete
to authenticated
using (user_id = auth.uid());
