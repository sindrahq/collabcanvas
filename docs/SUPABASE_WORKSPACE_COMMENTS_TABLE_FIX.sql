-- Fix for: Could not find the table 'public.workspace_comments' in the schema cache
-- Run this in Supabase SQL Editor.
-- Posting comments requires comment or edit access on the workspace share.

create extension if not exists pgcrypto;

create table if not exists public.workspace_comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  author_email text,
  message text not null,
  target_element_id text,
  resolved boolean not null default false,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_comments_workspace_idx on public.workspace_comments(workspace_id);
create index if not exists workspace_comments_author_idx on public.workspace_comments(author_id);
create index if not exists workspace_comments_target_idx on public.workspace_comments(target_element_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.workspace_comments to authenticated;

alter table public.workspace_comments enable row level security;

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
