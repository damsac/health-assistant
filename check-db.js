const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkLatestData() {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT metric_type, value, unit, recorded_at 
      FROM health_metric 
      WHERE user_id = 'xAM2VpuQCDkHoV1GeEuMkuYxAuWdAG7C'
      ORDER BY recorded_at DESC 
      LIMIT 10
    `);
    
    console.log('Latest 10 metrics:');
    result.rows.forEach(row => {
      console.log(`${row.recorded_at}: ${row.metric_type} = ${row.value} ${row.unit || ''}`);
    });
  } finally {
    client.release();
  }
}

checkLatestData().catch(console.error);
