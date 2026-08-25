const fs = require('fs');

// Read .env.local manually to avoid needing dotenv
const envContent = fs.readFileSync('.env.local', 'utf-8');
let supabaseUrl = '';
let supabaseKey = '';

envContent.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim();
  }
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    supabaseKey = line.split('=')[1].trim();
  }
});

async function checkData() {
  console.log("Fetching votes...");
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/votes?select=id,status_verifikasi,user_id`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    const data = await res.json();
    console.log("Votes in DB:", JSON.stringify(data, null, 2));

    const res2 = await fetch(`${supabaseUrl}/rest/v1/votes?select=*,users(*)`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    const data2 = await res2.json();
    console.log("Votes with Join:", JSON.stringify(data2, null, 2));
    
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

checkData();
