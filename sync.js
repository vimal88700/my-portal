const { createClient } = require('@supabase/supabase-js');

// Clean the base URL just in case
const cleanUrl = (process.env.SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '');
const supabase = createClient(cleanUrl, process.env.SUPABASE_KEY);

async function run() {
  let cookie = (process.env.CAMU_TOKEN || '').trim();

  if (!cookie.includes('connect.sid=')) {
    cookie = `connect.sid=${cookie}`;
  }
  if (!cookie.includes('X-App-Type=')) {
    cookie = `X-App-Type=student; ${cookie}`;
  }

  const headers = {
    'authority': 'www.mycamu.co.in',
    'accept': 'application/json, text/plain, */*',
    'appversion': 'v2',
    'clienttzofst': '330',
    'content-type': 'application/json',
    'cookie': cookie,
    'origin': 'https://www.mycamu.co.in',
    'referer': 'https://www.mycamu.co.in/v2/timetable',
    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
  };

  // Pull a 7-day range so you get your complete week of classes!
  const d = new Date();
  const start = new Date(d.setDate(d.getDate() - d.getDay() + 1)).toISOString().split('T')[0]; // Monday
  const end = new Date(d.setDate(d.getDate() + 6)).toISOString().split('T')[0]; // Saturday

  const timetablePayload = {
    "PrID": "5df210adf1dba1d3485db0af",
    "CrID": "5ed60635d94173123c145a64",
    "AcYr": "69575e6b6c9925f8ec4f73b5",
    "DeptID": "5ed60978398834225af3fbf2",
    "SemID": "5ed60cb9a63dc02528730f15",
    "SecID": "5df89db6ba1381ad1fa4ab30",
    "start": start,
    "end": end,
    "schdlTyp": "slctdSchdl",
    "isShowCancelledPeriod": true,
    "isFromTt": true
  };

  console.log(`Fetching schedule from ${start} to ${end}...`);

  try {
    const res = await fetch('https://www.mycamu.co.in/api/Timetable/get', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(timetablePayload)
    });

    if (!res.ok) {
      throw new Error(`MyCamu returned HTTP ${res.status}`);
    }

    const data = await res.json();
    console.log("MyCamu response:", JSON.stringify(data).slice(0, 200));

    // Save into Supabase and throw error if it fails
    const { error } = await supabase.from('academic_records').upsert([
      { id: 'timetable', content: data, updated_at: new Date().toISOString() },
      { id: 'metadata', content: { last_sync: new Date().toISOString() } }
    ]);

    if (error) {
      throw new Error("Supabase Database Error: " + error.message);
    }

    console.log("Successfully saved full week's timetable to Supabase!");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
