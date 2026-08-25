-- MENGAKTIFKAN LACI PENYIMPANAN RAHASIA UNTUK FOTO VOTE
INSERT INTO storage.buckets (id, name, public) 
VALUES ('foto-vote', 'foto-vote', false)
ON CONFLICT (id) DO NOTHING;

-- KEBIJAKAN KEAMANAN (RLS) UNTUK STORAGE foto-vote

-- 1. Server (Edge Functions) boleh mengunggah (INSERT) foto
CREATE POLICY "Edge Functions can upload foto vote"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'foto-vote');

-- 2. HANYA ADMIN yang boleh melihat / mengunduh foto (SELECT)
CREATE POLICY "Only admins can view foto vote"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'foto-vote' 
  AND auth.jwt() ->> 'role' IN ('admin_kpu', 'pengawas_sema')
);
