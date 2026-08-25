import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vdphlanneoyqnnmsvtrx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkcGhsYW5uZW95cW5ubXN2dHJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzU2OTU1NiwiZXhwIjoyMTAzMTQ1NTU2fQ.sIbtQWE7_Ax8sTIjmTJN4SpS3HqjgPAnPta5C9Z0oIQ'
);

async function main() {
  const { data: b1, error: e1 } = await supabase.storage.updateBucket('foto-ktm', { public: true });
  console.log('foto-ktm:', e1 ? e1.message : 'OK');
  
  const { data: b2, error: e2 } = await supabase.storage.updateBucket('foto-vote', { public: true });
  console.log('foto-vote:', e2 ? e2.message : 'OK');
}

main();
