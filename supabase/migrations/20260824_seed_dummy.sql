-- C10. Insert Dummy Data untuk Testing UI Verifikasi Suara

-- 1. Pastikan ada periode aktif
INSERT INTO periode_pemilihan (id, jenjang, tanggal_mulai, tanggal_selesai, status)
VALUES ('11111111-1111-1111-1111-111111111111', 'BEM-F', now() - interval '1 day', now() + interval '1 day', 'aktif')
ON CONFLICT (id) DO NOTHING;

-- 2. Buat Dummy User (Auth & Public)
-- Karena RLS, kita perlu insert ke auth.users dulu (simulasi)
INSERT INTO auth.users (id, email) 
VALUES ('22222222-2222-2222-2222-222222222222', 'dummy_student@test.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, nim, nama, wa_number, role, foto_ktm_url, status_registrasi)
VALUES (
  '22222222-2222-2222-2222-222222222222', 
  '12345678', 
  'Budi Santoso (Data Uji)', 
  '081234567890', 
  'mahasiswa',
  'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=400&auto=format&fit=crop', -- Foto Profil Asli (Dummy)
  'disetujui'
)
ON CONFLICT (nim) DO NOTHING;

-- 3. Buat Kandidat Dummy
INSERT INTO kandidat (id, periode_id, nomor_urut, nama, visi_misi)
VALUES ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 1, 'Paslon 1 Dummy', 'Visi misi dummy')
ON CONFLICT (periode_id, nomor_urut) DO NOTHING;

-- 4. Buat Vote Dummy (Menunggu Verifikasi)
INSERT INTO votes (id, user_id, periode_id, kandidat_id, foto_vote_url, nomor_bukti, status_verifikasi)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=400&auto=format&fit=crop', -- Foto Selfie (Dummy, agak beda dikit)
  'BKT-2026-0001',
  'menunggu_verifikasi'
)
ON CONFLICT (user_id, periode_id) DO NOTHING;
