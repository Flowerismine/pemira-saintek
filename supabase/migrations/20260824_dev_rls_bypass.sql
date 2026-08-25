-- BYPASS RLS SEMENTARA UNTUK DEVELOPMENT LOKAL
-- Karena kita belum membangun halaman Login Admin, 
-- aplikasi membaca database sebagai 'anon' (tamu tak dikenal).
-- Script ini akan mengizinkan tamu untuk membaca data agar UI bisa dites.

CREATE POLICY "Dev Bypass: Anyone can view users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Dev Bypass: Anyone can view votes" ON votes
  FOR SELECT USING (true);

CREATE POLICY "Dev Bypass: Anyone can update votes" ON votes
  FOR UPDATE USING (true);

CREATE POLICY "Dev Bypass: Anyone can manage whitelist" ON whitelist_mahasiswa
  FOR ALL USING (true);
