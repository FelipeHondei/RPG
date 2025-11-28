// Supabase PostgREST API client - Uses HTTP/HTTPS instead of direct Postgres (port 5432)
// This bypasses corporate firewalls that block port 5432
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Basic CORS support
const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

/**
 * Make a fetch request to Supabase PostgREST API
 */
async function supabaseRequest(method, endpoint, body = null) {
  const url = `${SUPABASE_URL}/rest/v1${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
      'Prefer': 'return=representation'
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log(`[PostgREST] ${method} ${endpoint}`);
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PostgREST error ${response.status}: ${errorText}`);
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  return null;
}

exports.handler = async function(event) {
  // Log environment setup
  console.log('SUPABASE_URL defined:', !!SUPABASE_URL);
  console.log('SUPABASE_KEY defined:', !!SUPABASE_KEY);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (event.httpMethod === 'GET') {
      const qs = event.queryStringParameters || {};
      
      // health check: /.netlify/functions/characters?health=1
      if (qs.health) {
        const result = await supabaseRequest('GET', '/characters?select=1&limit=1');
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
      }
      
      // Fetch single character: /.netlify/functions/characters?char=1
      if (qs.char) {
        const charNumber = parseInt(qs.char, 10);
        const result = await supabaseRequest('GET', `/characters?char_number=eq.${charNumber}&select=char_number,data`);
        const row = Array.isArray(result) ? result[0] : result;
        return { statusCode: 200, headers, body: JSON.stringify(row || null) };
      }
      
      // Fetch all characters
      const result = await supabaseRequest('GET', '/characters?select=char_number,data&order=char_number.asc');
      return { statusCode: 200, headers, body: JSON.stringify(Array.isArray(result) ? result : []) };
    }

    if (event.httpMethod === 'POST') {
      const body = event.body ? JSON.parse(event.body) : {};
      const charNumber = parseInt(body.char_number, 10);
      const data = body.data || {};

      if (!charNumber || Number.isNaN(charNumber)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'char_number required and must be an integer' }) };
      }

      console.log('Saving char', charNumber);

      // Try to fetch existing record
      const existing = await supabaseRequest('GET', `/characters?char_number=eq.${charNumber}&select=id`);
      const existsRecord = Array.isArray(existing) && existing.length > 0;

      let result;
      if (existsRecord) {
        // UPDATE existing
        result = await supabaseRequest('PATCH', `/characters?char_number=eq.${charNumber}`, {
          data: data,
          updated_at: new Date().toISOString()
        });
      } else {
        // INSERT new
        result = await supabaseRequest('POST', '/characters', {
          char_number: charNumber,
          data: data
        });
      }

      // Normalize response format (PostgREST may return array or single object)
      const responseData = Array.isArray(result) ? result[0] : result;
      return { statusCode: 200, headers, body: JSON.stringify(responseData) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  } catch (err) {
    console.error('Handler error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
