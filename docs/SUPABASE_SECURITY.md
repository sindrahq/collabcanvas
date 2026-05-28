# Supabase Security Checklist

This project uses Supabase for authentication and app data. Keep the following rules in place before deploying.

## Mandatory backend checks

- Enable Row Level Security on every app table.
- Deny public access by default; add only the minimum policies needed.
- Use `auth.uid()` in policies instead of trusting client-supplied user ids.
- Require `owner_id` on private workspaces.
- Allow shared workspaces only through explicit share rows.
- Keep authentication email/password only unless you intentionally enable an OAuth provider.
- Never trust client-side route checks as the only protection.
- Keep the service role key off the browser and out of client bundles.

## Tables used by the app

- `workspaces`
- `workspace_shares`
- `workspace_trash`
- `canvas_elements`
- `workspace_history`
- `workspace_comments`

## Recommended policy model

### `workspaces`

- Select: owner can read their own workspace.
- Insert: authenticated users can create rows only for themselves.
- Update/Delete: owner only.
- Shared users should not edit the workspace row unless you intentionally allow that.

### `workspace_shares`

- Select: workspace owner and the shared user can read share records for their workspace.
- Insert/Update/Delete: workspace owner only.

### `workspace_trash`

- Select: each user can read only their own trash rows.
- Insert/Delete: each user can only manage their own trash rows.

### `canvas_elements`

- Select: owner or explicitly shared user for the parent workspace.
- Insert/Update/Delete: only allowed to users who can edit that workspace.
- If you want collaborators to edit shared workspaces, the policy should check the share table as well.

### `workspace_history`

- Select: owner or shared editor.
- Insert: only during authorized saves.
- Delete: owner only unless you want shared cleanup rights.

### `workspace_comments`

- Select: owner, shared viewer, shared commenter, or shared editor.
- Insert: authenticated users with access to the workspace.
- Update/Delete: comment author or workspace owner, depending on whether you want edits and deletion controls.

## SQL policy template

Use this as a starting point and adjust to your exact sharing rules.

```sql
alter table public.workspaces enable row level security;
alter table public.workspace_shares enable row level security;
alter table public.workspace_trash enable row level security;
alter table public.canvas_elements enable row level security;
alter table public.workspace_history enable row level security;
alter table public.workspace_comments enable row level security;

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

drop policy if exists "workspace_trash_own_rows" on public.workspace_trash;

create policy "workspace_trash_own_rows"
on public.workspace_trash
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "canvas_elements_access_by_workspace" on public.canvas_elements;

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
  )
);

drop policy if exists "workspace_history_access_by_workspace" on public.workspace_history;
drop policy if exists "workspace_comments_access_by_workspace" on public.workspace_comments;
drop policy if exists "workspace_comments_insert_by_workspace" on public.workspace_comments;
drop policy if exists "workspace_comments_manage_author_or_owner" on public.workspace_comments;

create policy "workspace_history_access_by_workspace"
on public.workspace_history
for select
to authenticated
using (
  exists (
    select 1
    from public.workspaces w
    where w.id = workspace_history.workspace_id
      and w.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.workspace_shares s
    where s.workspace_id = workspace_history.workspace_id
      and s.shared_with_id = auth.uid()
  )
);

create policy "workspace_history_write_by_workspace"
on public.workspace_history
for insert
to authenticated
with check (
  exists (
    select 1
    from public.workspaces w
    where w.id = workspace_history.workspace_id
      and w.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.workspace_shares s
    where s.workspace_id = workspace_history.workspace_id
      and s.shared_with_id = auth.uid()
  )
);

create policy "workspace_comments_access_by_workspace"
on public.workspace_comments
for select
to authenticated
using (
  exists (
    select 1
    from public.workspaces w
    where w.id = workspace_comments.workspace_id
      and w.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.workspace_shares s
    where s.workspace_id = workspace_comments.workspace_id
      and s.active = true
      and (
        s.shared_with_id = auth.uid()
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
  author_id = auth.uid()
  and (
    exists (
      select 1
      from public.workspaces w
      where w.id = workspace_comments.workspace_id
        and w.owner_id = auth.uid()
    )
    or exists (
      select 1
      from public.workspace_shares s
      where s.workspace_id = workspace_comments.workspace_id
        and s.active = true
        and s.access_level in ('comment', 'edit')
        and (
          s.shared_with_id = auth.uid()
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
  author_id = auth.uid()
  or exists (
    select 1
    from public.workspaces w
    where w.id = workspace_comments.workspace_id
      and w.owner_id = auth.uid()
  )
)
with check (
  author_id = auth.uid()
  or exists (
    select 1
    from public.workspaces w
    where w.id = workspace_comments.workspace_id
      and w.owner_id = auth.uid()
  )
);

create policy "workspace_history_delete_owner"
on public.workspace_history
for delete
to authenticated
using (
  exists (
    select 1
    from public.workspaces w
    where w.id = workspace_history.workspace_id
      and w.owner_id = auth.uid()
  )
);
```

## Important implementation notes

- Your client-side auth flow is now paired with a server-side route guard.
- The app still relies on database policies for actual data security.
- If you add new tables later, they must get their own RLS policies.
- If you introduce admin roles, keep them explicit and separate from normal user access.
