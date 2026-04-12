-- Fix for: new row violates row-level security policy for table "workspaces"
-- Run this in Supabase SQL Editor if you are not using SUPABASE_SERVICE_ROLE_KEY.

-- Ensure table privileges are present for authenticated users.
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.workspaces to authenticated;

-- Enable RLS and add owner-scoped policies.
alter table public.workspaces enable row level security;

drop policy if exists "workspaces_select_owner" on public.workspaces;
drop policy if exists "workspaces_insert_owner" on public.workspaces;
drop policy if exists "workspaces_update_owner" on public.workspaces;
drop policy if exists "workspaces_delete_owner" on public.workspaces;

create policy "workspaces_select_owner"
on public.workspaces
for select
to authenticated
using (owner_id = auth.uid());

create policy "workspaces_insert_owner"
on public.workspaces
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "workspaces_update_owner"
on public.workspaces
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "workspaces_delete_owner"
on public.workspaces
for delete
to authenticated
using (owner_id = auth.uid());
