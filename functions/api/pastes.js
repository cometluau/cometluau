import { randId, randKey, hashKey, encryptKey, validate, readJson, json, fail, now, EXPIRY } from '../_lib/util.js';

export async function onRequestPost({ request, env }) {
  if (!env.KEY_SECRET) return fail(500, 'Server is not configured.');
  const body = await readJson(request);
  if (!body) return fail(400, 'Invalid request.');
  const { value, error } = validate(body);
  if (error) return fail(400, error);
  const t = now(), id = randId(10), key = randKey();
  const exp = EXPIRY[value.expiry];
  try {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM pastebins WHERE expires_at IS NOT NULL AND expires_at < ?').bind(t - 2592000),
      env.DB.prepare('INSERT INTO pastebins (id,title,description,source,created_at,updated_at,expires_at) VALUES (?,?,?,?,?,?,?)')
        .bind(id, value.title, value.description, value.source, t, t, exp === null ? null : t + exp),
      env.DB.prepare('INSERT INTO pastebin_management_keys (paste_id,key_hash,key_enc) VALUES (?,?,?)')
        .bind(id, await hashKey(env.KEY_SECRET, key), await encryptKey(env.KEY_SECRET, key)),
    ]);
  } catch { return fail(500, 'Could not create paste.'); }
  return json({ id, key, url: `/pastebin/${id}` }, 201);
}
