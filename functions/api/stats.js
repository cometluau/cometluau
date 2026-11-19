import { json, now, dbReady } from '../_lib/util.js';
export async function onRequestGet({ env }) {
  const bad = await dbReady(env);
  if (bad) return bad;
  const t = now();
  const r = await env.DB.prepare(`SELECT COUNT(*) AS total,
    SUM(CASE WHEN status='active' AND (expires_at IS NULL OR expires_at > ?1) THEN 1 ELSE 0 END) AS active,
    SUM(CASE WHEN expires_at IS NOT NULL AND expires_at <= ?1 THEN 1 ELSE 0 END) AS expired FROM pastebins`).bind(t).first();
  return json({ total: r.total || 0, active: r.active || 0, expired: r.expired || 0 });
}
