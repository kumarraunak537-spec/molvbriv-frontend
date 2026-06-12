const { Client } = require('pg');

async function testConn() {
  const password = 'j6bnEG%&O@IhtdD!HWw2*7euJNc8pOE*';
  const host = 'db.oiksafoujlduutkcgays.supabase.co';
  const connectionString = `postgresql://postgres:${encodeURIComponent(password)}@${host}:5432/postgres`;
  
  console.log('Testing connection to:', host);
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('SUCCESS: Connected to PostgreSQL database!');
    const res = await client.query('SELECT NOW()');
    console.log('Query result:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('CONNECTION FAILED:', err.message);
  }
}

testConn();
