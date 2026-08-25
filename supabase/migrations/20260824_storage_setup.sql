-- Buat bucket untuk menyimpan foto kandidat
insert into storage.buckets (id, name, public)
values ('foto-kandidat', 'foto-kandidat', true)
on conflict (id) do nothing;

-- Kebijakan (Policy) agar siapa saja (publik) bisa melihat/mendownload foto
create policy "Foto kandidat bisa dilihat secara publik"
on storage.objects for select
to public
using ( bucket_id = 'foto-kandidat' );

-- Kebijakan agar hanya admin (anon dari web admin atau authenticated) yang bisa upload
-- Karena kita pakai anon key untuk admin saat ini (MVP), kita buka akses insert untuk anon
create policy "Siapa saja bisa upload foto kandidat (MVP)"
on storage.objects for insert
to public
with check ( bucket_id = 'foto-kandidat' );

-- Kebijakan untuk update dan delete
create policy "Siapa saja bisa menghapus foto kandidat (MVP)"
on storage.objects for delete
to public
using ( bucket_id = 'foto-kandidat' );
