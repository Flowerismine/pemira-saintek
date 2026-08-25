-- Tabel untuk menyimpan kode OTP sementara
CREATE TABLE otp_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nim VARCHAR(50) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    wa_number VARCHAR(20),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS: Tidak ada siapapun (Tamu/Admin) yang boleh membaca/menulis tabel ini langsung dari Client.
-- Hanya Server (Edge Functions / Service Role) yang bisa mengelolanya.
ALTER TABLE otp_requests ENABLE ROW LEVEL SECURITY;
