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
  return { value: out };
}
export async function readJson(request) {
  if (Number(request.headers.get('content-length') || 0) > 600000) return null;
  try { return await request.json(); } catch { return null; }
}
export const LIVE = "status = 'active' AND (expires_at IS NULL OR expires_at > ?)";
