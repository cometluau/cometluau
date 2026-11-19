import { readJson, json, fail, now, hashKey, safeEq, secretOf, staffToken, dbReady } from '../../_lib/util.js';

export async function onRequestPost({ request, env }) {
  if (!env.STAFF_PASSWORD) return fail(503, 'Staff password is not set. Add a secret named STAFF_PASSWORD in Cloudflare (Pages project > Settings > Variables and Secrets) and redeploy.');
  const bad = await dbReady(env);
  if (bad) return bad;
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const t = now();
  let row = await env.DB.prepare('SELECT count, first_at FROM login_attempts WHERE ip = ?').bind(ip).first();
  if (row && t - row.first_at > 900) {
    await env.DB.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(ip).run();
    row = null;
  }
  if (row && row.count >= 5) return fail(429, 'Too many attempts. Try again in 15 minutes.');
  const body = (await readJson(request)) || {};
  const a = await hashKey(secretOf(env), String(body.password || ''));
  const b = await hashKey(secretOf(env), env.STAFF_PASSWORD);
  if (!safeEq(a, b)) {
    await env.DB.prepare('INSERT INTO login_attempts (ip, count, first_at) VALUES (?, 1, ?) ON CONFLICT(ip) DO UPDATE SET count = count + 1').bind(ip, t).run();
    return fail(401, 'Wrong password.');
  }
  await env.DB.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(ip).run();
  return json({ token: await staffToken(env) });
}
