const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const TABLE = 'honorarios_clientes';

async function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body) { resolve(req.body); return; }
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

async function supa(method, path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  if (req.method === 'GET') {
    const data = await supa('GET', `${TABLE}?order=nome.asc`);
    res.status(200).json(Array.isArray(data) ? data : []);
    return;
  }

  if (req.method === 'POST') {
    const body = await readBody(req);
    const data = await supa('POST', TABLE, body);
    res.status(200).json(data);
    return;
  }

  if (req.method === 'PUT') {
    const body = await readBody(req);
    const { id, ...fields } = body;
    const data = await supa('PATCH', `${TABLE}?id=eq.${id}`, fields);
    res.status(200).json(data);
    return;
  }

  if (req.method === 'DELETE') {
    const body = await readBody(req);
    const data = await supa('DELETE', `${TABLE}?id=eq.${body.id}`);
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
