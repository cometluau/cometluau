const te = new TextEncoder();
export const b64u = (b) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
export const EXPIRY = { '1hr': 3600, '1d': 86400, '1w': 604800, '1m': 2592000, '1yr': 31536000, forever: null };
export const now = () => Math.floor(Date.now() / 1000);
export const LIMITS = { source: 500000, title: 100, desc: 500 };

export function randId(n = 10) {
  const a = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  while (s.length < n) for (const x of crypto.getRandomValues(new Uint8Array(n))) if (x < 252 && s.length < n) s += a[x % 36];
  return s;
}
export const randKey = () => b64u(crypto.getRandomValues(new Uint8Array(24)));

// KEY_SECRET is optional. Management keys are 192-bit random values, so a hash is safe even with the built-in pepper.
export const secretOf = (env) => env.KEY_SECRET || env.STAFF_PASSWORD || 'comet-built-in-pepper-v1';
export const hasRealSecret = (env) => !!env.KEY_SECRET;
async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', te.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}
export async function hashKey(secret, key) {
  return b64u(await crypto.subtle.sign('HMAC', await hmacKey(secret), te.encode(key)));
}
export function safeEq(a, b) {
  const x = te.encode(a), y = te.encode(b);
  let d = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) d |= (x[i] || 0) ^ (y[i] || 0);
  return d === 0;
}
async function aesKey(secret, usage) {
  const raw = await crypto.subtle.digest('SHA-256', te.encode('key-enc:' + secret));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, usage);
}
export async function encryptKey(secret, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(secret, ['encrypt']), te.encode(key)));
  const out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12);
  return b64u(out);
}
export async function decryptKey(secret, blob) {
  const b = unb64u(blob);
  return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b.slice(0, 12) }, await aesKey(secret, ['decrypt']), b.slice(12)));
}

export const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
});
export const fail = (status, error) => json({ error }, status);

export function validate(body, partial = false) {
  const out = {};
  if (!partial || body.title !== undefined) {
    const t = String(body.title ?? '').trim();
    if (!t || t.length > LIMITS.title) return { error: `Title is required (max ${LIMITS.title} characters).` };
    out.title = t;
  }
  if (!partial || body.description !== undefined) {
    const d = String(body.description ?? '').trim();
    if (d.length > LIMITS.desc) return { error: `Description is too long (max ${LIMITS.desc}).` };
    out.description = d;
  }
  if (!partial || body.source !== undefined) {
    const s = String(body.source ?? '');
    if (!s.trim()) return { error: 'Lua source is required.' };
    if (s.length > LIMITS.source) return { error: 'Script is too large.' };
    if (s.includes('\u0000')) return { error: 'Invalid characters in source.' };
    out.source = s;
  }
  if (!partial || body.expiry !== undefined) {
    if (!Object.prototype.hasOwnProperty.call(EXPIRY, body.expiry)) return { error: 'Invalid expiration.' };
    out.expiry = body.expiry;
  }
  // 'private' = raw link only answers scripts. 'public' = anyone may open the raw link and read the source.
  if (body.visibility !== undefined || !partial) {
    const v = body.visibility === undefined ? 'private' : body.visibility;
    if (v !== 'private' && v !== 'public') return { error: 'Invalid access setting.' };
    out.visibility = v;
  }
  return { value: out };
}
export async function readJson(request) {
  if (Number(request.headers.get('content-length') || 0) > 600000) return null;
  try { return await request.json(); } catch { return null; }
}
export const LIVE = "status = 'active' AND (expires_at IS NULL OR expires_at > ?)";

export async function staffToken(env) {
  const exp = now() + 43200;
  return exp + '.' + (await hashKey(secretOf(env), 'staff:' + exp + ':' + env.STAFF_PASSWORD));
}
export async function staffAuthed(env, request) {
  if (!env.STAFF_PASSWORD) return false;
  const h = request.headers.get('authorization') || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : '';
  const [exp, sig] = t.split('.');
  if (!exp || !sig || !(Number(exp) > now())) return false;
  return safeEq(sig, await hashKey(secretOf(env), 'staff:' + exp + ':' + env.STAFF_PASSWORD));
}
export async function guard(env, request) {
  const bad = await dbReady(env);
  if (bad) return bad;
  return (await staffAuthed(env, request)) ? null : fail(401, 'Unauthorized.');
}

/* ---------- Security: who may read raw script source ---------- */
// Each script is either private (raw link answers scripts only) or public (anyone may read it). The owner picks when posting.
export const DENIED = '-- Access denied. This link only works when loaded by a script.';
export const isPrivate = (row) => !!row.private;
// Browsers always send Sec-Fetch-* headers and ask for text/html when you open a link.
// Roblox HttpGet / executor request functions send neither. (Headers can be faked by a determined person with curl,
// so this keeps casual viewers out; it is not encryption. Anything a script can download, a script can save.)
export function looksLikeBrowser(request) {
  const h = request.headers;
  if (h.get('sec-fetch-dest') || h.get('sec-fetch-mode') || h.get('sec-fetch-site') || h.get('sec-fetch-user')) return true;
  if (h.get('upgrade-insecure-requests')) return true;
  if ((h.get('accept') || '').toLowerCase().includes('text/html')) return true;
  return false;
}

/* ---------- Database: connect check + automatic table creation ---------- */
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS pastebins (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', source TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, expires_at INTEGER, status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','taken_down')), takedown_reason TEXT, user_id TEXT, views INTEGER NOT NULL DEFAULT 0)`,
  `CREATE INDEX IF NOT EXISTS idx_pastebins_created ON pastebins(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_pastebins_expires ON pastebins(expires_at)`,
  `CREATE TABLE IF NOT EXISTS pastebin_management_keys (paste_id TEXT PRIMARY KEY REFERENCES pastebins(id) ON DELETE CASCADE, key_hash TEXT NOT NULL, key_enc TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS login_attempts (ip TEXT PRIMARY KEY, count INTEGER NOT NULL, first_at INTEGER NOT NULL)`,
];
const MIGRATIONS = [`ALTER TABLE pastebins ADD COLUMN private INTEGER NOT NULL DEFAULT 1`];
let schemaOk = false;
export async function dbReady(env) {
  if (!env.DB) return fail(503, 'Database is not connected. In Cloudflare: Pages project > Settings > Bindings > add a D1 binding named DB that points to the cometluau database, then redeploy.');
  if (schemaOk) return null;
  try {
    await env.DB.batch(SCHEMA.map((q) => env.DB.prepare(q)));
    for (const q of MIGRATIONS) {
      try { await env.DB.prepare(q).run(); } catch (e) { if (!/duplicate column/i.test(String((e && e.message) || e))) throw e; }
    }
    schemaOk = true;
    return null;
  } catch (e) {
    return fail(503, 'Database error: ' + String((e && e.message) || e).slice(0, 160));
  }
}
