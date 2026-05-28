-- Apply this in Supabase SQL Editor to set up RLS policies for activity_log table
-- Ensures users can only read activity from workspaces they own or have access to

alter table public.activity_log enable row level security;

-- Allow authenticated users to SELECT activity logs only from workspaces they own or have access to
drop policy if exists "activity_log_select_by_workspace" on public.activity_log;

create policy "activity_log_select_by_workspace"
on public.activity_log
for select
to authenticated
using (
  exists (
    select 1
    from public.workspaces w
    where w.id = activity_log.workspace_id
      and w.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.workspace_shares s
    where s.workspace_id = activity_log.workspace_id
      and s.shared_with_id = auth.uid()
      and s.active = true
  )
);

-- Allow service role (server-side API) to INSERT activity logs
-- Authenticated users cannot insert directly (must go through server API for proper logging)
drop policy if exists "activity_log_insert_service_role" on public.activity_log;

create policy "activity_log_insert_service_role"
on public.activity_log
for insert
to service_role
with check (true);

-- Activity logs should be immutable - no updates or deletes
-- If you need to allow deletion for admin/owner, add a separate policy here
