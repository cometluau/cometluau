import { validate, readJson, hashKey, safeEq, json, fail, now, EXPIRY, LIVE } from '../../_lib/util.js';

const ID = /^[a-z0-9]{10}$/;
async function authed(env, id, request) {
  const key = request.headers.get('x-manage-key') || '';
  const row = await env.DB.prepare('SELECT key_hash FROM pastebin_management_keys WHERE paste_id = ?').bind(id).first();
  const h = await hashKey(env.KEY_SECRET, key);
  const ok = safeEq(h, row ? row.key_hash : 'x'.repeat(h.length));
  if (!row || !key || !ok) return false;
  return !!(await env.DB.prepare(`SELECT 1 FROM pastebins WHERE id = ? AND ${LIVE}`).bind(id, now()).first());
}

export async function onRequestGet({ params, env }) {
  const id = params.id;
  if (!ID.test(id)) return fail(404, 'Paste not found.');
  const r = await env.DB.prepare(`SELECT id,title,description,source,created_at,expires_at,views FROM pastebins WHERE id = ? AND ${LIVE}`).bind(id, now()).first();
  if (!r) return fail(404, 'Paste not found or expired.');
  env.DB.prepare('UPDATE pastebins SET views = views + 1 WHERE id = ?').bind(id).run();
  return json(r);
}
export async function onRequestPut({ params, env, request }) {
  const id = params.id;
  if (!ID.test(id) || !(await authed(env, id, request))) return fail(403, 'Invalid management key.');
  const body = await readJson(request);
  if (!body) return fail(400, 'Invalid request.');
  const { value, error } = validate(body, true);
  if (error) return fail(400, error);
  const t = now(), sets = [], vals = [];
  for (const k of ['title', 'description', 'source']) if (k in value) { sets.push(`${k} = ?`); vals.push(value[k]); }
  if ('expiry' in value) { sets.push('expires_at = ?'); vals.push(EXPIRY[value.expiry] === null ? null : t + EXPIRY[value.expiry]); }
  if (!sets.length) return fail(400, 'Nothing to update.');
  await env.DB.prepare(`UPDATE pastebins SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`).bind(...vals, t, id).run();
  return json({ ok: true });
}
export async function onRequestDelete({ params, env, request }) {
  const id = params.id;
  if (!ID.test(id) || !(await authed(env, id, request))) return fail(403, 'Invalid management key.');
  await env.DB.prepare('DELETE FROM pastebins WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
