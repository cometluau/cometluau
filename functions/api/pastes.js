import { randId, randKey, hashKey, encryptKey, secretOf, hasRealSecret, validate, readJson, json, fail, now, dbReady, EXPIRY } from '../_lib/util.js';

export async function onRequestPost({ request, env }) {
  const bad = await dbReady(env);
  if (bad) return bad;
  const body = await readJson(request);
  if (!body) return fail(400, 'Invalid request.');
  const { value, error } = validate(body);
  if (error) return fail(400, error);
  const t = now(), id = randId(10), key = randKey();
  const exp = EXPIRY[value.expiry];
  const secret = secretOf(env);
  try {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM pastebins WHERE expires_at IS NOT NULL AND expires_at < ?').bind(t - 2592000),
      env.DB.prepare('INSERT INTO pastebins (id,title,description,source,created_at,updated_at,expires_at) VALUES (?,?,?,?,?,?,?)')
        .bind(id, value.title, value.description, value.source, t, t, exp === null ? null : t + exp),
      env.DB.prepare('INSERT INTO pastebin_management_keys (paste_id,key_hash,key_enc) VALUES (?,?,?)')
        .bind(id, await hashKey(secret, key), hasRealSecret(env) ? await encryptKey(secret, key) : ''),
    ]);
  } catch (e) { return fail(500, 'Could not create paste: ' + String((e && e.message) || e).slice(0, 120)); }
  return json({ id, key, url: `/pastebin/${id}` }, 201);
}
