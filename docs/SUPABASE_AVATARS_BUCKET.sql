-- Create a public bucket for profile avatars.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Keep policies idempotent.
drop policy if exists "avatars_public_read" on storage.objects;
drop policy if exists "avatars_auth_upload" on storage.objects;
drop policy if exists "avatars_owner_update" on storage.objects;
drop policy if exists "avatars_owner_delete" on storage.objects;

-- Public can read avatar files.
create policy "avatars_public_read"
on storage.objects
for select
to public
using (bucket_id = 'avatars');

-- Authenticated users can upload only inside their own folder: <auth.uid()>/<filename>
create policy "avatars_auth_upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can update only their own avatar files.
create policy "avatars_owner_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and owner = auth.uid()
)
with check (
  bucket_id = 'avatars'
  and owner = auth.uid()
);

-- Authenticated users can delete only their own avatar files.
create policy "avatars_owner_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and owner = auth.uid()
);
