const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
  let cookie = (process.env.CAMU_TOKEN || '').trim();

  // Format cookie if only connect.sid was passed
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

  const today = new Date().toISOString().split('T')[0];

  // Your exact college timetable parameters from your network capture
  const timetablePayload = {
    "PrID": "5df210adf1dba1d3485db0af",
    "CrID": "5ed60635d94173123c145a64",
    "AcYr": "69575e6b6c9925f8ec4f73b5",
    "DeptID": "5ed60978398834225af3fbf2",
    "SemID": "5ed60cb9a63dc02528730f15",
    "SecID": "5df89db6ba1381ad1fa4ab30",
    "start": today,
    "end": today,
    "schdlTyp": "slctdSchdl",
    "isShowCancelledPeriod": true,
    "isFromTt": true
  };

  console.log("Fetching live timetable from MyCamu...");

  try {
    const res = await fetch('https://www.mycamu.co.in/api/Timetable/get', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(timetablePayload)
    });

    if (!res.ok) {
      throw new Error(`Server returned status: ${res.status}`);
    }

    const data = await res.json();
    console.log("Timetable data received successfully!");

    // Save timetable into Supabase
    await supabase.from('academic_records').upsert([
      { id: 'timetable', content: data, updated_at: new Date().toISOString() },
      { id: 'metadata', content: { last_sync: new Date().toISOString() } }
    ]);

    console.log("Database updated successfully!");
  } catch (err) {
    console.error("Sync failed:", err.message);
    process.exit(1);
  }
}

run();
