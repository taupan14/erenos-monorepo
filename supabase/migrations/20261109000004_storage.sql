-- Erenos Christian School — Storage bucket 'media'
-- Bucket publik: file bisa dibuka lewat URL publik tanpa policy.
-- Policy di bawah hanya untuk staf (upload, ganti, hapus, daftar file),
-- sehingga pengunjung tidak bisa menelusuri isi bucket lewat API.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'application/pdf']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy media_objects_staff_all on storage.objects
  for all to authenticated
  using (bucket_id = 'media' and (select public.is_staff()))
  with check (bucket_id = 'media' and (select public.is_staff()));
