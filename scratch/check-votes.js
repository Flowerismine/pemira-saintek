const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vdphlanneoyqnnmsvtrx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkcGhsYW5uZW95cW5ubXN2dHJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzU2OTU1NiwiZXhwIjoyMTAzMTQ1NTU2fQ.sIbtQWE7_Ax8sTIjmTJN4SpS3HqjgPAnPta5C9Z0oIQ'
);

async function main() {
  const { data: votes, error } = await supabase.from('votes').select('*');
  console.log('Votes Table:', JSON.stringify(votes, null, 2));
  console.log('Error:', error);
}

main();
