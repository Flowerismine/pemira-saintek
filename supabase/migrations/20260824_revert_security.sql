-- MENGEMBALIKAN SISTEM KEAMANAN KE STANDAR PRODUCTION

-- 1. Hapus policy Bypass RLS yang sebelumnya dibuat untuk tamu (anon)
DROP POLICY IF EXISTS "Dev Bypass: Anyone can view users" ON users;
DROP POLICY IF EXISTS "Dev Bypass: Anyone can view votes" ON votes;
DROP POLICY IF EXISTS "Dev Bypass: Anyone can update votes" ON votes;

-- 2. Hapus data dummy user & vote karena data tersebut cacat (tidak punya akun auth.users)
-- Perhatian: ini akan menghapus dummy user dan dummy vote yang kita buat tadi
DELETE FROM votes WHERE user_id = '22222222-2222-2222-2222-222222222222';
DELETE FROM users WHERE id = '22222222-2222-2222-2222-222222222222';

-- 3. Pasang kembali kunci gembok (Foreign Key) yang menghubungkan users dengan auth.users
ALTER TABLE users 
ADD CONSTRAINT users_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) 
ON DELETE CASCADE;
