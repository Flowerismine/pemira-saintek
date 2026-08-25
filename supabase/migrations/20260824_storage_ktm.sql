-- MENGAKTIFKAN LACI PENYIMPANAN UNTUK FOTO KTM (Private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('foto-ktm', 'foto-ktm', false)
ON CONFLICT (id) DO NOTHING;

-- KEBIJAKAN KEAMANAN (RLS) UNTUK STORAGE foto-ktm

-- 1. Mahasiswa hanya boleh upload KTM mereka sendiri.
-- Kita gunakan auth.uid() sebagai pengenal. (File sebaiknya dinamai dengan user_id mereka)
CREATE POLICY "Mahasiswa can upload their own KTM"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'foto-ktm' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 2. Mahasiswa bisa melihat KTM mereka sendiri (jika butuh render di app)
CREATE POLICY "Mahasiswa can view their own KTM"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'foto-ktm' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. HANYA ADMIN yang boleh melihat/mengunduh semua foto KTM (untuk verifikasi KYC)
CREATE POLICY "Only admins can view all foto ktm"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'foto-ktm' 
  AND auth.jwt() ->> 'role' IN ('admin_kpu', 'pengawas_sema')
);
