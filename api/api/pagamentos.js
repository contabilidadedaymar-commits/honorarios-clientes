const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const TABLE = 'honorarios_pagamentos';

async function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body) { resolve(req.body); return; }
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); } });
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
      'Prefer': 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  // GET ?cliente_id=xxx  → todos pagamentos do cliente
  if (req.method === 'GET') {
    const { cliente_id } = req.query;
    const q = cliente_id ? `${TABLE}?cliente_id=eq.${cliente_id}&order=mes.desc` : `${TABLE}?order=mes.desc`;
    const data = await supa('GET', q);
    res.status(200).json(Array.isArray(data) ? data : []);
    return;
  }

  // POST { cliente_id, mes, status }   mes = "2025-06"
  if (req.method === 'POST') {
    const body = await readBody(req);
    // upsert via DELETE + INSERT para simplicidade
    await supa('DELETE', `${TABLE}?cliente_id=eq.${body.cliente_id}&mes=eq.${body.mes}`);
    const data = await supa('POST', TABLE, body);
    res.status(200).json(data);
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
