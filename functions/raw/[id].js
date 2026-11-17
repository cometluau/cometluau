import { now, LIVE } from '../_lib/util.js';
const H = { 'content-type': 'text/plain; charset=utf-8', 'x-content-type-options': 'nosniff', 'cache-control': 'no-store', 'access-control-allow-origin': '*' };
export async function onRequestGet({ request, params, env }) {
  const id = String(params.id).replace(/\.lua$/i, '');
  if (id === 'main') {
    const r = await env.ASSETS.fetch(new Request(new URL('/main.lua', request.url)));
    return new Response(r.body, { status: r.status, headers: H });
  }
  const r = /^[a-z0-9]{10}$/.test(id) ? await env.DB.prepare(`SELECT source FROM pastebins WHERE id = ? AND ${LIVE}`).bind(id, now()).first() : null;
  return r ? new Response(r.source, { headers: H }) : new Response('-- not found', { status: 404, headers: H });
}
