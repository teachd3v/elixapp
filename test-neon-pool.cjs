const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');

async function test() {
  const dbUrl = "postgresql://neondb_owner:npg_PAYlzNIn43QB@ep-fragrant-silence-aol7ak5m-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
  
  console.log('Testing Pool with:', dbUrl);
  try {
    const pool = new Pool({ connectionString: dbUrl });
    const client = await pool.connect();
    console.log('Connected successfully!');
    client.release();
  } catch (err) {
    console.error('Error connecting:', err);
  }
}

test();
