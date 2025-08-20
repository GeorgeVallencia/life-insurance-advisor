// test-render-connection.js
require('dotenv').config();
const { Pool } = require('pg');

async function testConnection() {
  console.log('Testing connection to:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@'));
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Render requires SSL
    }
  });

  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to Render PostgreSQL!');
    
    const result = await client.query('SELECT version()');
    console.log('Database version:', result.rows[0].version);
    
    client.release();
  } catch (err) {
    console.error('❌ Connection failed:');
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    
    if (err.code === 'ENOTFOUND') {
      console.log('\n🔍 Troubleshooting:');
      console.log('- Check if the hostname is correct in your DATABASE_URL');
      console.log('- Make sure you\'re using the External Database URL from Render');
    }
  } finally {
    await pool.end();
  }
}

testConnection();