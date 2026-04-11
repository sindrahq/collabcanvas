-- Fix for: Could not find the table 'public.workspace_shares' in the schema cache
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.workspace_shares (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  shared_by_id uuid not null references auth.users(id) on delete cascade,
  shared_with_id uuid references auth.users(id) on delete set null,
  shared_with_email text,
  access_level text not null default 'view' check (access_level in ('view', 'comment', 'edit')),
  share_kind text not null default 'email' check (share_kind in ('email', 'link')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_shares_target_required check (
    shared_with_id is not null or coalesce(shared_with_email, '') <> ''
  )
);

create index if not exists workspace_shares_workspace_idx on public.workspace_shares(workspace_id);
create index if not exists workspace_shares_shared_with_id_idx on public.workspace_shares(shared_with_id);
create index if not exists workspace_shares_shared_with_email_idx on public.workspace_shares(lower(shared_with_email));

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.workspace_shares to authenticated;

alter table public.workspace_shares enable row level security;

drop policy if exists "workspace_shares_select_owner_or_shared" on public.workspace_shares;
drop policy if exists "workspace_shares_write_owner" on public.workspace_shares;

create policy "workspace_shares_select_owner_or_shared"
on public.workspace_shares
for select
to authenticated
using (
  exists (
    select 1
    from public.workspaces w
    where w.id = workspace_shares.workspace_id
      and w.owner_id = auth.uid()
  )
  or shared_with_id = auth.uid()
  or (shared_with_email is not null and lower(shared_with_email) = lower(auth.email()))
);

create policy "workspace_shares_write_owner"
on public.workspace_shares
for all
to authenticated
using (
  exists (
    select 1
    from public.workspaces w
    where w.id = workspace_shares.workspace_id
      and w.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workspaces w
    where w.id = workspace_shares.workspace_id
      and w.owner_id = auth.uid()
  )
);
