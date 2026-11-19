import { now, LIVE, dbReady, looksLikeBrowser, DENIED } from '../_lib/util.js';

const H = { 'content-type': 'text/plain; charset=utf-8', 'x-content-type-options': 'nosniff', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow', vary: 'Sec-Fetch-Dest, Accept' };

export async function onRequestGet({ request, params, env, waitUntil }) {
  const id = String(params.id).replace(/\.lua$/i, '');
  // The main loader stays public, exactly as before.
  if (id === 'loader') {
    const r = await env.ASSETS.fetch(new Request(new URL('/loader.lua', request.url)));
    return new Response(r.body, { status: r.status, headers: { ...H, 'access-control-allow-origin': '*' } });
  }
  const bad = await dbReady(env);
  if (bad) return new Response('-- Database is not connected.', { status: 503, headers: H });
  const r = /^[a-z0-9]{10}$/.test(id) ? await env.DB.prepare(`SELECT source, private FROM pastebins WHERE id = ? AND ${LIVE}`).bind(id, now()).first() : null;
  if (!r) return new Response('-- not found', { status: 404, headers: H });
  // Private scripts: browsers get the denial message, scripts (HttpGet) get the source. Public scripts: everyone gets the source.
  if (r.private && looksLikeBrowser(request)) return new Response(DENIED, { status: 403, headers: H });
  const bump = env.DB.prepare('UPDATE pastebins SET views = views + 1 WHERE id = ?').bind(id).run();
  if (waitUntil) waitUntil(bump);
  return new Response(r.source, { headers: H });
}
