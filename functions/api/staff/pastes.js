import { json, guard } from '../../_lib/util.js';

export async function onRequestGet({ request, env }) {
  const denied = await guard(env, request);
  if (denied) return denied;
  const u = new URL(request.url);
  const q = '%' + (u.searchParams.get('q') || '').replace(/[%_]/g, '') + '%';
  const status = ['active', 'taken_down'].includes(u.searchParams.get('status')) ? u.searchParams.get('status') : '';
  const page = Math.max(0, parseInt(u.searchParams.get('page') || '0', 10) || 0);
  const size = 30;
  const total = await env.DB.prepare("SELECT COUNT(*) AS n FROM pastebins WHERE (title LIKE ?1 OR id LIKE ?1) AND (?2 = '' OR status = ?2)").bind(q, status).first();
  const { results } = await env.DB.prepare(
    "SELECT id, title, status, created_at, expires_at, views, length(source) AS size FROM pastebins WHERE (title LIKE ?1 OR id LIKE ?1) AND (?2 = '' OR status = ?2) ORDER BY created_at DESC LIMIT ?3 OFFSET ?4"
  ).bind(q, status, size, page * size).all();
  return json({ items: results, total: total.n, size });
}
