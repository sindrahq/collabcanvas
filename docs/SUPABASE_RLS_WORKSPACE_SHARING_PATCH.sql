-- Apply this in Supabase SQL Editor to allow authenticated owners
-- to create/sync/share workspaces and read/write related canvas/comments data.

alter table public.workspaces enable row level security;
alter table public.workspace_shares enable row level security;
alter table public.canvas_elements enable row level security;
alter table public.workspace_comments enable row level security;

-- -----------------------------
-- workspaces
-- -----------------------------
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

-- -----------------------------
-- workspace_shares
-- -----------------------------
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
  or (
    shared_with_email is not null
    and lower(shared_with_email) = lower(coalesce(auth.jwt() ->> 'email', auth.email(), ''))
  )
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

-- -----------------------------
-- canvas_elements
-- -----------------------------
drop policy if exists "canvas_elements_access_by_workspace" on public.canvas_elements;
drop policy if exists "canvas_elements_write_by_workspace" on public.canvas_elements;
drop policy if exists "canvas_elements_update_by_workspace" on public.canvas_elements;
drop policy if exists "canvas_elements_delete_by_workspace" on public.canvas_elements;

create policy "canvas_elements_access_by_workspace"
on public.canvas_elements
for select
to authenticated
using (
  exists (
    select 1
    from public.workspaces w
    where w.id = canvas_elements.workspace_id
      and w.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.workspace_shares s
    where s.workspace_id = canvas_elements.workspace_id
      and s.shared_with_id = auth.uid()
      and s.active = true
  )
);

create policy "canvas_elements_write_by_workspace"
on public.canvas_elements
for insert
to authenticated
with check (
  exists (
    select 1
    from public.workspaces w
    where w.id = canvas_elements.workspace_id
      and w.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.workspace_shares s
    where s.workspace_id = canvas_elements.workspace_id
      and s.shared_with_id = auth.uid()
      and s.active = true
      and s.access_level = 'edit'
  )
);

create policy "canvas_elements_update_by_workspace"
on public.canvas_elements
for update
to authenticated
using (
  exists (
    select 1
    from public.workspaces w
    where w.id = canvas_elements.workspace_id
      and w.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.workspace_shares s
    where s.workspace_id = canvas_elements.workspace_id
      and s.shared_with_id = auth.uid()
      and s.active = true
      and s.access_level = 'edit'
  )
)
with check (
  exists (
    select 1
    from public.workspaces w
    where w.id = canvas_elements.workspace_id
      and w.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.workspace_shares s
    where s.workspace_id = canvas_elements.workspace_id
      and s.shared_with_id = auth.uid()
      and s.active = true
      and s.access_level = 'edit'
  )
);

create policy "canvas_elements_delete_by_workspace"
on public.canvas_elements
for delete
to authenticated
using (
  exists (
    select 1
    from public.workspaces w
    where w.id = canvas_elements.workspace_id
      and w.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.workspace_shares s
    where s.workspace_id = canvas_elements.workspace_id
      and s.shared_with_id = auth.uid()
      and s.active = true
      and s.access_level = 'edit'
  )
);

-- -----------------------------
-- workspace_comments
-- -----------------------------
drop policy if exists "workspace_comments_access_by_workspace" on public.workspace_comments;
drop policy if exists "workspace_comments_insert_by_workspace" on public.workspace_comments;
drop policy if exists "workspace_comments_manage_author_or_owner" on public.workspace_comments;

create policy "workspace_comments_access_by_workspace"
on public.workspace_comments
for select
to authenticated
using (
  exists (
    select 1
    from public.workspaces w
    where w.id = workspace_comments.workspace_id
      and w.owner_id::text = auth.uid()::text
  )
  or exists (
    select 1
    from public.workspace_shares s
    where s.workspace_id = workspace_comments.workspace_id
      and s.active = true
      and (
        s.shared_with_id::text = auth.uid()::text
        or (
          s.shared_with_email is not null
          and lower(s.shared_with_email) = lower(coalesce(auth.jwt() ->> 'email', auth.email(), ''))
        )
      )
  )
);

create policy "workspace_comments_insert_by_workspace"
on public.workspace_comments
for insert
to authenticated
with check (
  author_id::text = auth.uid()::text
  and (
  exists (
    select 1
    from public.workspaces w
    where w.id = workspace_comments.workspace_id
      and w.owner_id::text = auth.uid()::text
  )
  or exists (
    select 1
    from public.workspace_shares s
    where s.workspace_id = workspace_comments.workspace_id
      and s.active = true
      and s.access_level in ('comment', 'edit')
      and (
        s.shared_with_id::text = auth.uid()::text
        or (
          s.shared_with_email is not null
          and lower(s.shared_with_email) = lower(coalesce(auth.jwt() ->> 'email', auth.email(), ''))
        )
      )
  )
  )
);

create policy "workspace_comments_manage_author_or_owner"
on public.workspace_comments
for update
to authenticated
using (
  author_id::text = auth.uid()::text
  or exists (
    select 1
    from public.workspaces w
    where w.id = workspace_comments.workspace_id
      and w.owner_id::text = auth.uid()::text
  )
)
with check (
  author_id::text = auth.uid()::text
  or exists (
    select 1
    from public.workspaces w
    where w.id = workspace_comments.workspace_id
      and w.owner_id::text = auth.uid()::text
  )
);
