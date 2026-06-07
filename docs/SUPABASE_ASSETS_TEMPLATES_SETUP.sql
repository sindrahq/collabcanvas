-- Backend setup required by the asset-library and canvas-template integrations.
-- Run in Supabase SQL Editor before testing these features.

create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public)
values ('user-uploads', 'user-uploads', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "user_uploads_select_own" on storage.objects;
drop policy if exists "user_uploads_insert_own" on storage.objects;
drop policy if exists "user_uploads_update_own" on storage.objects;
drop policy if exists "user_uploads_delete_own" on storage.objects;

create policy "user_uploads_select_own"
on storage.objects for select to authenticated
using (
  bucket_id = 'user-uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "user_uploads_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'user-uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "user_uploads_update_own"
on storage.objects for update to authenticated
using (
  bucket_id = 'user-uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'user-uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "user_uploads_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'user-uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  preview_url text,
  elements jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists templates_user_created_idx
on public.templates(user_id, created_at desc);

alter table public.templates enable row level security;
grant select, insert, update, delete on public.templates to authenticated;

drop policy if exists "templates_select_own" on public.templates;
drop policy if exists "templates_insert_own" on public.templates;
drop policy if exists "templates_update_own" on public.templates;
drop policy if exists "templates_delete_own" on public.templates;

create policy "templates_select_own"
on public.templates for select to authenticated
using (user_id = auth.uid());

create policy "templates_insert_own"
on public.templates for insert to authenticated
with check (user_id = auth.uid());

create policy "templates_update_own"
on public.templates for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "templates_delete_own"
on public.templates for delete to authenticated
using (user_id = auth.uid());
