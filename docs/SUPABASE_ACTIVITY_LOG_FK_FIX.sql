-- Fix activity_log table to make user_id nullable and remove FK constraint
-- This allows logging activities without requiring a valid user_id

-- Remove the foreign key constraint if it exists
alter table public.activity_log
  drop constraint if exists activity_log_user_id_fkey;

-- Make user_id nullable (if it isn't already)
alter table public.activity_log
  alter column user_id drop not null;

-- Add back an optional foreign key if you want referential integrity
-- (commented out - uncomment if needed)
-- alter table public.activity_log
--   add constraint activity_log_user_id_fkey
--   foreign key (user_id) references auth.users(id) on delete set null;
