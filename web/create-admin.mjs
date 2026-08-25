import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vdphlanneoyqnnmsvtrx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkcGhsYW5uZW95cW5ubXN2dHJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzU2OTU1NiwiZXhwIjoyMTAzMTQ1NTU2fQ.sIbtQWE7_Ax8sTIjmTJN4SpS3HqjgPAnPta5C9Z0oIQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createAdmin() {
  const email = 'admin@kpu.saintek.ac.id';
  const password = 'AdminSaintek2026!'; // Default password

  console.log(`Creating admin user ${email}...`);
  
  const { data, error } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
  });

  if (error) {
    console.error('Error creating user:', error.message);
  } else {
    console.log('Success! Admin user created.');
    console.log('Email:', email);
    console.log('Password:', password);
  }
}

createAdmin();
