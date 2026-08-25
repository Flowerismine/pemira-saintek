-- C1.1 Tabel Whitelist Mahasiswa (DPT)
-- Digunakan untuk bulk import data mahasiswa yang berhak memilih
CREATE TABLE whitelist_mahasiswa (
    nim VARCHAR(50) PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    fakultas VARCHAR(100),
    jurusan VARCHAR(100),
    kelas VARCHAR(50),
    is_registered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS untuk whitelist
ALTER TABLE whitelist_mahasiswa ENABLE ROW LEVEL SECURITY;

-- Publik bisa melihat whitelist (untuk cek hak pilih)
CREATE POLICY "Anyone can view whitelist" ON whitelist_mahasiswa
  FOR SELECT USING (true);
  
-- Admin bisa mengatur whitelist
CREATE POLICY "Admins can manage whitelist" ON whitelist_mahasiswa
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin_kpu', 'pengawas_sema'));
