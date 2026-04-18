-- Optional schema upgrade for older projects missing newer canvas/comment columns.
-- Run this in Supabase SQL Editor to get full feature parity.

alter table public.canvas_elements
  add column if not exists rotation double precision default 0,
  add column if not exists text_content text,
  add column if not exists style_ext jsonb,
  add column if not exists layer_order integer default 0,
  add column if not exists visible boolean default true,
  add column if not exists locked boolean default false;

alter table public.workspace_comments
  add column if not exists target_element_id text,
  add column if not exists resolved boolean default false,
  add column if not exists resolved_at timestamptz;

-- If older schema uses UUID for element ids, switch to text so local ids like
-- "circle-53fd8619" are accepted.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'canvas_elements'
      and column_name = 'id'
      and udt_name = 'uuid'
  ) then
    alter table public.workspace_comments drop constraint if exists workspace_comments_target_element_id_fkey;
    alter table public.canvas_elements alter column id type text using id::text;
  end if;
end $$;

-- If target_element_id is UUID in existing projects, convert to text for compatibility.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'workspace_comments'
      and column_name = 'target_element_id'
      and udt_name = 'uuid'
  ) then
    alter table public.workspace_comments alter column target_element_id type text using target_element_id::text;
  end if;
end $$;
