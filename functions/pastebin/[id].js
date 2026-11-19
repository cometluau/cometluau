// Serves the paste viewer for /pastebin/ID while keeping the URL (and the ID) exactly as typed.
// A plain _redirects rewrite to /paste.html makes Cloudflare Pages redirect to /paste, which loses the ID.
export async function onRequestGet({ request, env }) {
  const origin = new URL(request.url).origin;
  for (const path of ['/paste', '/paste.html']) {
    let res = await env.ASSETS.fetch(new Request(origin + path, { redirect: 'manual' }));
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      res = await env.ASSETS.fetch(new Request(new URL(res.headers.get('location'), origin), { redirect: 'manual' }));
    }
    if (res.ok && (res.headers.get('content-type') || '').includes('text/html')) {
      return new Response(res.body, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache', 'x-robots-tag': 'noindex' } });
    }
  }
  return new Response('Not found', { status: 404 });
}
