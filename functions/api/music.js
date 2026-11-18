// Lists every audio file in public/music so the site can loop-play them.
// 1) uses public/music/playlist.json when the build step made one, 2) otherwise asks GitHub for the folder contents.
const AUDIO = /\.(mp3|ogg|oga|wav|m4a|aac|flac|opus|webm)$/i;
const H = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=60' };
const out = (tracks, status = 200) => new Response(JSON.stringify({ tracks }), { status, headers: H });
const pretty = (f) => decodeURIComponent(f).replace(AUDIO, '').replace(/[_-]+/g, ' ').trim();

export async function onRequestGet({ request, env }) {
  try {
    const r = await env.ASSETS.fetch(new Request(new URL('/music/playlist.json', request.url)));
    if (r.ok && (r.headers.get('content-type') || '').includes('json')) {
      const list = await r.json();
      if (Array.isArray(list)) return out(list.filter((t) => t && t.file && AUDIO.test(t.file)).map((t) => ({ name: t.name || pretty(t.file), url: '/music/' + encodeURIComponent(t.file) })));
    }
  } catch { /* fall through to GitHub */ }
  const repo = env.GITHUB_REPO || 'cometluau/cometluau';
  const branch = env.GITHUB_BRANCH || 'main';
  const dir = env.GITHUB_MUSIC_DIR || 'public/music';
  try {
    const g = await fetch(`https://api.github.com/repos/${repo}/contents/${dir}?ref=${branch}`, {
      headers: { 'user-agent': 'cometluau-site', accept: 'application/vnd.github+json' },
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (!g.ok) return out([]);
    const files = await g.json();
    const tracks = (Array.isArray(files) ? files : [])
      .filter((f) => f.type === 'file' && AUDIO.test(f.name))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
      .map((f) => ({ name: pretty(f.name), url: '/music/' + encodeURIComponent(f.name) }));
    return out(tracks);
  } catch { return out([]); }
}
