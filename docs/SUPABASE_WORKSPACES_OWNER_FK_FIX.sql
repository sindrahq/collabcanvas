-- Fix for: insert or update on table "workspaces" violates foreign key constraint "workspaces_owner_id_fkey"
-- This normalizes owner FK to auth.users(id), which matches Supabase Auth user IDs.

begin;

-- Remove orphan workspace rows that point to non-auth users.
-- Comment this out if you prefer to manually review and migrate these rows first.
delete from public.workspaces w
where not exists (
  select 1
  from auth.users u
  where u.id = w.owner_id
);

-- Recreate FK to auth.users.
alter table public.workspaces
  drop constraint if exists workspaces_owner_id_fkey;

alter table public.workspaces
  add constraint workspaces_owner_id_fkey
  foreign key (owner_id)
  references auth.users(id)
  on delete cascade;

-- Keep grants + RLS policies in place for authenticated owners.
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.workspaces to authenticated;

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

commit;
