const { Client } = require('pg');
require('dotenv').config({ path: '.env.production' });

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

client.connect().then(async () => {
  console.log('Connected to database');
  
  // Check users table structure
  const result = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    ORDER BY ordinal_position
  `);
  
  console.log('Users table structure:');
  result.rows.forEach(row => {
    console.log(`  ${row.column_name}: ${row.data_type} (default: ${row.column_default})`);
  });
  
  await client.end();
}).catch(err => {
  console.error('Database connection error:', err.message);
  process.exit(1);
});
