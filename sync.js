const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
  const token = (process.env.CAMU_TOKEN || '').trim().replace(/^Bearer\s+/i, '');
  if (!token) {
    console.error("Missing token!");
    process.exit(1);
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
  };

  // Common MyCamu student endpoints
  const endpoints = {
    timetable: 'https://www.mycamu.com/api/student/timetable',
    assignments: 'https://www.mycamu.com/api/student/assignments'
  };

  for (const [key, url] of Object.entries(endpoints)) {
    try {
      console.log(`Fetching ${key}...`);
      const res = await fetch(url, { headers });
      if (res.ok) {
        const json = await res.json();
        await supabase.from('academic_records').upsert([
          { id: key, content: json, updated_at: new Date().toISOString() }
        ]);
        console.log(`Saved ${key} successfully.`);
      } else {
        console.warn(`Endpoint ${key} gave status: ${res.status}`);
      }
    } catch (err) {
      console.error(`Error with ${key}:`, err.message);
    }
  }

  // Save sync timestamp
  await supabase.from('academic_records').upsert([
    { id: 'metadata', content: { last_sync: new Date().toISOString() } }
  ]);

  console.log("Sync finished.");
}

run();
