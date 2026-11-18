// Public script directory. Searches title, description and ID only. Source code is never returned here.
import { json, now, dbReady, LIVE } from '../_lib/util.js';

const SIZE = 24;
const MAIN = { id: 'main', title: 'Comet main script', description: 'The official Comet loader.', created_at: null, views: null, size: null, pinned: true };

export async function onRequestGet({ request, env }) {
  const bad = await dbReady(env);
  if (bad) return bad;
  const u = new URL(request.url);
  const raw = (u.searchParams.get('q') || '').trim().slice(0, 80);
  const q = '%' + raw.replace(/[%_\\]/g, '') + '%';
  const page = Math.max(0, parseInt(u.searchParams.get('page') || '0', 10) || 0);
  const t = now();
  const where = `${LIVE} AND (title LIKE ? OR description LIKE ? OR id LIKE ?)`;
  const total = await env.DB.prepare(`SELECT COUNT(*) AS n FROM pastebins WHERE ${where}`).bind(t, q, q, q).first();
  const { results } = await env.DB.prepare(
    `SELECT id, title, description, created_at, views, length(source) AS size FROM pastebins WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).bind(t, q, q, q, SIZE, page * SIZE).all();
  const hay = (MAIN.title + ' ' + MAIN.description + ' main').toLowerCase();
  const items = page === 0 && (!raw || hay.includes(raw.toLowerCase())) ? [MAIN, ...results] : results;
  return json({ items, total: total.n, size: SIZE });
}
