import { now, LIVE } from '../_lib/util.js';
const H = { 'content-type': 'text/plain; charset=utf-8', 'x-content-type-options': 'nosniff', 'cache-control': 'no-store', 'access-control-allow-origin': '*' };
export async function onRequestGet({ params, env }) {
  const id = params.id;
  const r = /^[a-z0-9]{10}$/.test(id) ? await env.DB.prepare(`SELECT source FROM pastebins WHERE id = ? AND ${LIVE}`).bind(id, now()).first() : null;
  return r ? new Response(r.source, { headers: H }) : new Response('-- not found', { status: 404, headers: H });
}
