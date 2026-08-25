-- TAHAP C: INITIAL SCHEMA E-VOTING KAMPUS
-- (Verifikasi Biometrik dan PIN ditiadakan)

-- C1. Buat tabel users
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nim VARCHAR(50) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  wa_number VARCHAR(20) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'mahasiswa' CHECK (role IN ('mahasiswa', 'admin_kpu', 'pengawas_sema')),
  kelas VARCHAR(50),
  jurusan VARCHAR(100),
  fakultas VARCHAR(100),
  foto_ktm_url TEXT,
  status_registrasi VARCHAR(50) DEFAULT 'pending' CHECK (status_registrasi IN ('pending', 'disetujui', 'ditolak')),
  consent_data_wajah_at TIMESTAMP WITH TIME ZONE,
  device_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- C2. Buat tabel periode_pemilihan
CREATE TABLE periode_pemilihan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jenjang VARCHAR(50) NOT NULL CHECK (jenjang IN ('Kosma', 'HMJ', 'BEM-F', 'SEMA-F', 'Universitas')),
  fakultas_id VARCHAR(100),
  jurusan_id VARCHAR(100),
  tanggal_mulai TIMESTAMP WITH TIME ZONE NOT NULL,
  tanggal_selesai TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'aktif', 'ditutup'))
);

-- C3. Buat tabel kandidat
CREATE TABLE kandidat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periode_id UUID NOT NULL REFERENCES periode_pemilihan(id) ON DELETE CASCADE,
  nomor_urut INTEGER NOT NULL,
  nama VARCHAR(255) NOT NULL,
  foto_url TEXT,
  visi_misi TEXT,
  UNIQUE(periode_id, nomor_urut)
);

-- C4. Buat tabel votes
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  periode_id UUID NOT NULL REFERENCES periode_pemilihan(id),
  kandidat_id UUID NOT NULL REFERENCES kandidat(id),
  foto_vote_url TEXT NOT NULL,
  device_id TEXT,
  hash_record TEXT,
  nomor_bukti TEXT UNIQUE NOT NULL,
  status_verifikasi VARCHAR(50) DEFAULT 'menunggu_verifikasi' CHECK (status_verifikasi IN ('menunggu_verifikasi', 'terverifikasi', 'gagal_verifikasi')),
  catatan_admin TEXT,
  direview_oleh UUID REFERENCES users(id),
  direview_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Mencegah vote ganda yang aktif di periode yang sama
  UNIQUE(user_id, periode_id)
);

-- C5. Buat tabel checkpoint_transparansi
CREATE TABLE checkpoint_transparansi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periode_id UUID NOT NULL REFERENCES periode_pemilihan(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  jumlah_suara_per_kandidat JSONB NOT NULL,
  hash_terakhir TEXT
);

-- C6. Buat tabel audit_log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  aksi VARCHAR(100) NOT NULL,
  target_table VARCHAR(50) NOT NULL,
  target_id TEXT NOT NULL,
  detail JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- C7. INDEXES untuk performa (Antrian Verifikasi & Live Counter)
CREATE INDEX votes_user_id_idx ON votes(user_id);
CREATE INDEX votes_periode_id_idx ON votes(periode_id);
CREATE INDEX votes_status_verifikasi_idx ON votes(status_verifikasi);

-- =========================================================================
-- C8. ROW LEVEL SECURITY (RLS)
-- =========================================================================

-- Aktifkan RLS di semua tabel
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE periode_pemilihan ENABLE ROW LEVEL SECURITY;
ALTER TABLE kandidat ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoint_transparansi ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- 1. Users Policy
-- Mahasiswa hanya bisa melihat dan merubah datanya sendiri
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 2. Periode Pemilihan Policy
-- Semua orang yang login bisa melihat periode aktif (untuk beranda)
CREATE POLICY "Anyone can view active periods" ON periode_pemilihan
  FOR SELECT USING (status = 'aktif' OR status = 'ditutup');

-- 3. Kandidat Policy
-- Semua orang yang login bisa melihat kandidat
CREATE POLICY "Anyone can view candidates" ON kandidat
  FOR SELECT USING (true);

-- 4. Votes Policy
-- Mahasiswa hanya bisa melihat data vote miliknya sendiri (Halaman Status Suara Saya)
CREATE POLICY "Users can view own votes" ON votes
  FOR SELECT USING (auth.uid() = user_id);

-- 5. Checkpoint Transparansi (Publik)
-- Bisa dibaca oleh anon (tanpa login) untuk Papan Transparansi
CREATE POLICY "Anyone can view transparency checkpoints" ON checkpoint_transparansi
  FOR SELECT USING (true);

-- Catatan Tambahan:
-- Policy untuk Admin KPU dan Pengawas SEMA-F (hak akses penuh atau read-only ke seluruh tabel) 
-- membutuhkan custom logic atau pengecekan auth.jwt() yang lebih kompleks. 
-- Agar aman, modifikasi tabel dari admin disarankan menggunakan Edge Functions dengan service_role key, 
-- namun Admin bisa diberikan policy SELECT ke seluruh data.
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin_kpu', 'pengawas_sema'));

CREATE POLICY "Admins can view all votes" ON votes
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin_kpu', 'pengawas_sema'));
