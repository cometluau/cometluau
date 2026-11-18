import { validate, readJson, json, fail, now, EXPIRY, decryptKey, secretOf, guard } from '../../../_lib/util.js';

const ID = /^[a-z0-9]{10}$/;

export async function onRequestGet({ params, env, request }) {
  const denied = await guard(env, request);
  if (denied) return denied;
  const id = params.id;
  if (!ID.test(id)) return fail(404, 'Paste not found.');
  const r = await env.DB.prepare('SELECT id, title, description, source, created_at, updated_at, expires_at, status, takedown_reason, views FROM pastebins WHERE id = ?').bind(id).first();
  if (!r) return fail(404, 'Paste not found.');
  let manage_key = null;
  const k = await env.DB.prepare('SELECT key_enc FROM pastebin_management_keys WHERE paste_id = ?').bind(id).first();
  if (k && k.key_enc) {
    try { manage_key = await decryptKey(secretOf(env), k.key_enc); } catch { manage_key = null; }
  }
  return json({ ...r, manage_key });
}

export async function onRequestPut({ params, env, request }) {
  const denied = await guard(env, request);
  if (denied) return denied;
  const id = params.id;
  if (!ID.test(id)) return fail(404, 'Paste not found.');
  const body = await readJson(request);
  if (!body) return fail(400, 'Invalid request.');
  const { value, error } = validate(body, true);
  if (error) return fail(400, error);
  const t = now(), sets = [], vals = [];
  for (const k of ['title', 'description', 'source']) if (k in value) { sets.push(`${k} = ?`); vals.push(value[k]); }
  if ('expiry' in value) { sets.push('expires_at = ?'); vals.push(EXPIRY[value.expiry] === null ? null : t + EXPIRY[value.expiry]); }
  if (body.status === 'active') { sets.push('status = ?', 'takedown_reason = NULL'); vals.push('active'); }
  else if (body.status === 'taken_down') { sets.push('status = ?', 'takedown_reason = ?'); vals.push('taken_down', String(body.takedown_reason || '').trim().slice(0, 300) || null); }
  else if (body.status !== undefined) return fail(400, 'Invalid status.');
  if (!sets.length) return fail(400, 'Nothing to update.');
  const r = await env.DB.prepare(`UPDATE pastebins SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`).bind(...vals, t, id).run();
  if (!r.meta || r.meta.changes === 0) return fail(404, 'Paste not found.');
  return json({ ok: true });
}

export async function onRequestDelete({ params, env, request }) {
  const denied = await guard(env, request);
  if (denied) return denied;
  const id = params.id;
  if (!ID.test(id)) return fail(404, 'Paste not found.');
  await env.DB.prepare('DELETE FROM pastebin_management_keys WHERE paste_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM pastebins WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
