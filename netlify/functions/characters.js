const { Pool } = require('pg');

// Reuse global pool in serverless environment to avoid exhausting connections
let pool;
function getPool() {
  if (pool) return pool;
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
  });
  return pool;
}

exports.handler = async function(event) {
  // Basic CORS support
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const pool = getPool();

  try {
    if (event.httpMethod === 'GET') {
      const qs = event.queryStringParameters || {};
      if (qs.char) {
        const res = await pool.query('SELECT char_number, data FROM characters WHERE char_number = $1', [qs.char]);
        return { statusCode: 200, headers, body: JSON.stringify(res.rows[0] || null) };
      } else {
        const res = await pool.query('SELECT char_number, data FROM characters ORDER BY char_number');
        return { statusCode: 200, headers, body: JSON.stringify(res.rows) };
      }
    }

    if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
      const body = event.body ? JSON.parse(event.body) : {};
      const charNumber = parseInt(body.char_number, 10);
      const data = body.data || {};

      if (!charNumber || Number.isNaN(charNumber)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'char_number required and must be an integer' }) };
      }

      const res = await pool.query(
        `INSERT INTO characters (char_number, data) VALUES ($1, $2::jsonb)
         ON CONFLICT (char_number) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
         RETURNING char_number, data;`,
        [charNumber, data]
      );

      return { statusCode: 200, headers, body: JSON.stringify(res.rows[0]) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
