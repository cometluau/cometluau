import { startEffects } from '/js/effects.js';
export const $ = (s, r = document) => r.querySelector(s);
const KW = new Set('and break do else elseif end for function goto if in local not or repeat return then until while continue'.split(' '));
const CONST = new Set(['true', 'false', 'nil']);
const BUILTIN = new Set('print warn error assert pairs ipairs next select type typeof tostring tonumber pcall xpcall require loadstring load setmetatable getmetatable rawget rawset rawequal rawlen unpack tick time wait spawn delay task game workspace script shared _G _VERSION Instance Vector3 Vector2 CFrame Color3 BrickColor UDim UDim2 Enum TweenInfo Rect Ray Random string table math os coroutine bit32 utf8 debug buffer getgenv getrenv getfenv setfenv getrawmetatable setreadonly hookfunction hookmetamethod newcclosure checkcaller request readfile writefile isfile'.split(' '));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const sp = (c, s) => '<span class="' + c + '">' + esc(s) + '</span>';

export function highlight(src) {
  const n = src.length;
  let i = 0, out = '', prev = '', depth = 0;
  while (i < n) {
    const ch = src[i];
    const head = src.slice(i, i + 48);
    if (ch === '-' && src[i + 1] === '-') {
      const m = /^--\[(=*)\[/.exec(head);
      let end;
      if (m) {
        const close = ']' + m[1] + ']';
        const k = src.indexOf(close, i + m[0].length);
        end = k < 0 ? n : k + close.length;
      } else {
        const k = src.indexOf('\n', i);
        end = k < 0 ? n : k;
      }
      out += sp('c', src.slice(i, end));
      i = end;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      let j = i + 1;
      while (j < n && src[j] !== ch && src[j] !== '\n') {
        if (src[j] === '\\') j++;
        j++;
      }
      if (src[j] === ch) j++;
      if (j > n) j = n;
      out += sp('s', src.slice(i, j));
      prev = 'str';
      i = j;
      continue;
    }
    if (ch === '[') {
      const m = /^\[(=*)\[/.exec(head);
      if (m) {
        const close = ']' + m[1] + ']';
        const k = src.indexOf(close, i + m[0].length);
        const end = k < 0 ? n : k + close.length;
        out += sp('s', src.slice(i, end));
        prev = 'str';
        i = end;
        continue;
      }
    }
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(src[i + 1] || '') && prev !== 'id' && prev !== ')' && prev !== ']')) {
      const m = /^(0[xX][0-9a-fA-F_]+|0[bB][01_]+|[0-9][0-9_]*(?:\.[0-9_]*)?(?:[eE][+-]?[0-9]+)?|\.[0-9][0-9_]*(?:[eE][+-]?[0-9]+)?)/.exec(head);
      if (m) {
        out += sp('n', m[0]);
        prev = 'num';
        i += m[0].length;
        continue;
      }
    }
    if (/[A-Za-z_]/.test(ch)) {
      const w = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i, i + 80))[0];
      i += w.length;
      const after = /^\s*(?:\(|"|'|\[=*\[|\{)/.test(src.slice(i, i + 12));
      const member = prev === '.' || prev === ':';
      if (!member && KW.has(w)) { out += sp('k', w); prev = 'kw:' + w; }
      else if (!member && CONST.has(w)) { out += sp('t', w); prev = 'id'; }
      else if (prev === 'kw:function') { out += sp('f', w); prev = 'id'; }
      else if (member) { out += sp(after ? 'f' : 'p', w); prev = 'id'; }
      else if (BUILTIN.has(w)) { out += sp(after ? 'f' : 'b', w); prev = 'id'; }
      else if (after) { out += sp('f', w); prev = 'id'; }
      else { out += esc(w); prev = 'id'; }
      continue;
    }
    if (ch === '(' || ch === '{' || ch === '[') {
      out += sp('d' + (depth % 3), ch);
      depth++;
      prev = ch;
      i++;
      continue;
    }
    if (ch === ')' || ch === '}' || ch === ']') {
      depth = Math.max(0, depth - 1);
      out += sp('d' + (depth % 3), ch);
      prev = ch;
      i++;
      continue;
    }
    if (ch === '.' && src.startsWith('...', i)) { out += sp('o', '...'); prev = 'op'; i += 3; continue; }
    if (ch === '.' && src[i + 1] === '.') { out += sp('o', '..'); prev = 'op'; i += 2; continue; }
    if (/[+\-*\/%^#=<>~.:,;|&?!@]/.test(ch)) { out += sp('o', ch); prev = ch; i++; continue; }
    out += esc(ch);
    if (!/\s/.test(ch)) prev = ch;
    i++;
  }
  return out;
}

export function codeBox(src) {
  const n = src.split('\n').length;
  return `<div class="codebox"><pre class="gutter">${Array.from({ length: n }, (_, i) => i + 1).join('\n')}</pre><pre><code>${highlight(src)}</code></pre></div>`;
}

export function editor(host) {
  host.classList.add('ed');
  host.innerHTML = '<pre class="ed-hl" aria-hidden="true"><code></code></pre><textarea class="ed-ta" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" aria-label="Lua source"></textarea>';
  const pre = host.querySelector('pre');
  const code = host.querySelector('code');
  const ta = host.querySelector('textarea');
  const sync = () => { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; };
  const paint = () => { code.innerHTML = highlight(ta.value) + '\n'; sync(); };
  ta.addEventListener('input', paint);
  ta.addEventListener('scroll', sync);
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      ta.setRangeText('\t', ta.selectionStart, ta.selectionEnd, 'end');
      ta.dispatchEvent(new Event('input'));
    }
  });
  paint();
  return { get: () => ta.value, set: (v) => { ta.value = v; ta.scrollTop = 0; ta.scrollLeft = 0; paint(); } };
}

export function toast(msg, err = false) {
  let box = $('#toasts');
  if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('role', 'status'); document.body.append(box); }
  const t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : ''); t.textContent = msg; box.append(t);
  setTimeout(() => t.remove(), 3500);
}
export async function copy(text, btn) {
  try { await navigator.clipboard.writeText(text); toast('Copied to clipboard'); if (btn) { const o = btn.textContent; btn.textContent = 'Copied ✓'; setTimeout(() => (btn.textContent = o), 1500); } }
  catch { toast('Copy failed', true); }
}
export function confirmDialog(message) {
  return new Promise((res) => {
    const d = document.createElement('dialog');
    d.innerHTML = '<p></p><div class="row"><button class="btn danger" value="y">Confirm</button><button class="btn ghost" value="n">Cancel</button></div>';
    d.querySelector('p').textContent = message;
    d.addEventListener('click', (e) => { if (e.target.value) { d.close(); res(e.target.value === 'y'); d.remove(); } });
    d.addEventListener('cancel', () => { res(false); d.remove(); });
    document.body.append(d); d.showModal();
  });
}
export async function api(path, opts = {}) {
  const r = await fetch(path, { ...opts, headers: { 'content-type': 'application/json', ...(opts.headers || {}) } });
  const data = await r.json().catch(() => null);
  if (!r.ok || data === null) {
    const msg = (data && data.error) || (r.status === 404 ? 'The server API was not found. Make sure the functions folder is deployed with the site.' : 'Request failed (' + r.status + ').');
    const e = new Error(msg); e.status = r.status; throw e;
  }
  return data;
}

function fx() {
  const glow = $('.glow');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cur = null;
  document.addEventListener('pointermove', (e) => {
    if (glow) glow.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
    const p = e.target.closest ? e.target.closest('.card') : null;
    if (cur && cur !== p) cur.style.transform = '';
    cur = p;
    if (!p) return;
    const r = p.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    p.style.setProperty('--mx', x + 'px');
    p.style.setProperty('--my', y + 'px');
    if (!calm && !p.querySelector('textarea,input,select,.ed,.codebox,.list')) {
      p.style.transform = 'perspective(1000px) rotateX(' + (y / r.height - 0.5) * -7 + 'deg) rotateY(' + (x / r.width - 0.5) * 7 + 'deg) translateY(-4px)';
    }
  });
  document.documentElement.addEventListener('pointerleave', () => { if (cur) cur.style.transform = ''; cur = null; });
}

const PLAY = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
const PAUSE = '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
const NEXT = '<svg viewBox="0 0 24 24"><path d="M6 5l9 7-9 7zM17 5h2v14h-2z"/></svg>';
const VOL = '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9zM16 8.5a5 5 0 010 7l-1.4-1.4a3 3 0 000-4.2zM18.8 5.7a9 9 0 010 12.6l-1.4-1.4a7 7 0 000-9.8z"/></svg>';
const MUTE = '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9zM16 9.6l1.4-1.4 2.1 2.1 2.1-2.1L23 9.6 20.9 11.7 23 13.8l-1.4 1.4-2.1-2.1-2.1 2.1-1.4-1.4 2.1-2.1z"/></svg>';

/* ---------- private / public access toggle (shared by the create, manage and staff pages) ---------- */
export const VIS_TEXT = {
  private: 'Private: the raw link only works when loaded by a script (HttpGet). Browsers see "-- Access denied. This link only works when loaded by a script."',
  public: 'Public: anyone can open the raw link and read the source.',
};
export function seg(name, value = 'private') {
  const c = (v) => (v === value ? ' checked' : '');
  return `<div class="seg" role="radiogroup" aria-label="Raw link access"><input type="radio" name="${name}" id="${name}-private" value="private"${c('private')}><label for="${name}-private">Private</label><input type="radio" name="${name}" id="${name}-public" value="public"${c('public')}><label for="${name}-public">Public</label></div><p class="muted visnote" id="${name}-note"></p>`;
}
export function segGet(name) { const r = document.querySelector(`input[name="${name}"]:checked`); return r ? r.value : 'private'; }
export function segSet(name, v) {
  const r = document.querySelector(`input[name="${name}"][value="${v}"]`);
  if (r) r.checked = true;
  const n = document.getElementById(name + '-note'); if (n) n.textContent = VIS_TEXT[segGet(name)];
}
export function segInit(name, v = 'private') {
  document.querySelectorAll(`input[name="${name}"]`).forEach((r) => r.addEventListener('change', () => segSet(name, segGet(name))));
  segSet(name, v);
}

/* ---------- music: loops every track in /music and keeps its place across pages ---------- */
// Resolves to a small controller. Playing needs a user gesture on most browsers, so the intro asks for one when needed.
async function music(deferStart) {
  let tracks = [];
  try { tracks = (await api('/api/music')).tracks || []; } catch { return { has: false }; }
  if (!tracks.length) return { has: false };
  const ls = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  let idx = Math.min(parseInt(ls('cm_track', '0'), 10) || 0, tracks.length - 1);
  const a = new Audio();
  a.preload = 'auto';
  a.volume = Math.min(1, Math.max(0, parseFloat(ls('cm_vol', '0.5'))));
  a.muted = ls('cm_muted', '0') === '1';
  a.loop = tracks.length === 1;
  const box = document.createElement('div');
  box.className = 'player'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Music');
  box.innerHTML = '<button type="button" id="mp" aria-label="Play or pause"></button><span class="tn" id="mn"></span><button type="button" id="mx" aria-label="Next track">' + NEXT + '</button><button type="button" id="mm" aria-label="Mute"></button><input id="mv" type="range" min="0" max="1" step="0.01" aria-label="Volume">';
  document.body.append(box);
  const name = box.querySelector('#mn'), pp = box.querySelector('#mp'), mm = box.querySelector('#mm'), mv = box.querySelector('#mv');
  const paint = () => { pp.innerHTML = a.paused ? PLAY : PAUSE; mm.innerHTML = a.muted ? MUTE : VOL; mv.value = a.volume; };
  const load = (i, t = 0) => {
    idx = (i + tracks.length) % tracks.length; set('cm_track', idx);
    a.src = tracks[idx].url;
    a.addEventListener('loadedmetadata', () => { if (t && t < (a.duration || 1e9)) a.currentTime = t; }, { once: true });
    name.textContent = tracks[idx].name; name.title = tracks[idx].name;
  };
  if (tracks.length < 2) box.querySelector('#mx').hidden = true;
  load(idx, parseFloat(ls('cm_time', '0')) || 0);
  paint();
  const userPaused = () => ls('cm_paused', '0') === '1';
  const play = () => a.play().then(() => { paint(); return true; }).catch(() => false);
  const arm = () => {
    const go = () => { removeEventListener('pointerdown', go); removeEventListener('keydown', go); if (!userPaused() && a.paused) play(); };
    addEventListener('pointerdown', go); addEventListener('keydown', go);
  };
  if (!deferStart && !userPaused()) play().then((ok) => { if (!ok) arm(); });
  pp.onclick = () => { if (a.paused) { set('cm_paused', '0'); play(); } else { a.pause(); set('cm_paused', '1'); paint(); } };
  box.querySelector('#mx').onclick = () => { load(idx + 1); if (!userPaused()) play(); };
  mm.onclick = () => { a.muted = !a.muted; set('cm_muted', a.muted ? '1' : '0'); paint(); };
  mv.oninput = () => { a.volume = +mv.value; a.muted = false; set('cm_vol', mv.value); set('cm_muted', '0'); paint(); };
  a.addEventListener('ended', () => { load(idx + 1); play(); });
  a.addEventListener('error', () => { if (tracks.length > 1) { load(idx + 1); play(); } });
  a.addEventListener('play', paint); a.addEventListener('pause', paint);
  let last = 0;
  a.addEventListener('timeupdate', () => { const n = Date.now(); if (n - last > 1000) { last = n; set('cm_time', a.currentTime.toFixed(1)); } });
  addEventListener('pagehide', () => set('cm_time', a.currentTime.toFixed(1)));
  return { has: true, userPaused, play };
}

/* ---------- intro: logo animates in, then glides into the top bar while the page fades in and the music starts ---------- */
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function intro(musicReady) {
  const root = document.documentElement;
  if (!root.classList.contains('intro')) return;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bg = document.createElement('div'); bg.id = 'splash'; bg.className = 'splash-el';
  const img = new Image(); img.id = 'splash-logo'; img.className = 'splash-el'; img.alt = ''; img.src = '/img/logo-large.jpg';
  const hint = document.createElement('p'); hint.id = 'splash-hint'; hint.className = 'splash-el'; hint.textContent = 'Click anywhere to enter';
  document.body.append(bg, img, hint);
  const done = () => { root.classList.remove('intro', 'revealing', 'landing'); bg.remove(); img.remove(); hint.remove(); };
  try {
    await Promise.race([img.decode().catch(() => {}), wait(2500)]);
    const W = innerWidth, Hh = innerHeight;
    const S = Math.max(150, Math.min(420, Math.min(W, Hh) * 0.46));
    const cx = W / 2, cy = Hh * 0.46;
    const at = (x, y, k) => `translate(${x - (S * k) / 2}px, ${y - (S * k) / 2}px) scale(${k})`;
    img.style.width = img.style.height = S + 'px';
    img.style.transform = at(cx, cy, 1);
    if (!calm) await img.animate([{ opacity: 0, transform: at(cx, cy, 0.5), filter: 'blur(10px)' }, { opacity: 1, transform: at(cx, cy, 1), filter: 'blur(0)' }], { duration: 1200, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }).finished;
    else await wait(250);
    // music: start it now if the browser allows, otherwise wait for the visitor's first click (browsers require one)
    const m = await musicReady;
    if (m.has && !m.userPaused()) {
      if (!(await m.play())) {
        hint.classList.add('on');
        await new Promise((res) => {
          const go = () => { removeEventListener('pointerdown', go, true); removeEventListener('keydown', go, true); m.play(); res(); };
          addEventListener('pointerdown', go, true); addEventListener('keydown', go, true);
        });
      }
    }
    const mark = document.querySelector('nav .mark');
    const t = mark ? mark.getBoundingClientRect() : null;
    root.classList.add('revealing', 'landing');
    hint.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' });
    if (calm || !t) { await bg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }).finished; return; }
    bg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1000, delay: 250, easing: 'ease', fill: 'forwards' });
    await img.animate([{ transform: at(cx, cy, 1) }, { transform: at(t.left + t.width / 2, t.top + t.height / 2, t.width / S) }], { duration: 1300, easing: 'cubic-bezier(.65,0,.2,1)', fill: 'forwards' }).finished;
  } catch { /* never leave the page hidden */ } finally { done(); }
}

/* ---------- navigation without reloading, so the music never stops ---------- */
let navSeq = 0, pageScript = null;
const SKIP = /^\/(raw|img|music|api)(\/|$)|^\/main\.lua$|\.lua$/;
function setActive() {
  const here = location.pathname.replace(/\/+$/, '').split('/')[1] || '';
  document.querySelectorAll('nav a[data-nav]').forEach((a) => { if (a.dataset.nav === here) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
}
async function go(url, push = true) {
  const my = ++navSeq;
  const old = document.querySelector('body > main');
  if (old) old.classList.add('page-out');
  try {
    const r = await fetch(url, { headers: { accept: 'text/html' } });
    const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
    const next = doc.querySelector('main');
    if (!next) throw new Error('no page');
    if (my !== navSeq) return;
    const final = new URL(r.url);
    if (final.origin !== location.origin) throw new Error('left site');
    const code = doc.querySelector('body > script[type="module"]');
    document.title = doc.title || document.title;
    const fresh = document.adoptNode(next);
    fresh.classList.add('page-in');
    if (old) old.replaceWith(fresh); else document.body.prepend(fresh);
    if (push) history.pushState({}, '', final.pathname + final.search + (new URL(url, location.href).hash || ''));
    scrollTo(0, 0);
    setActive();
    if (pageScript) pageScript.remove();
    pageScript = document.createElement('script'); pageScript.type = 'module'; pageScript.textContent = code ? code.textContent : '';
    document.body.append(pageScript);
  } catch { location.href = url; }
}
export function navigate(url) { return go(url); }
function router() {
  history.scrollRestoration = 'manual';
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || SKIP.test(u.pathname)) return;
    if (u.pathname === location.pathname && u.search === location.search) { if (!u.hash) { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); } return; }
    e.preventDefault();
    go(u.pathname + u.search + u.hash);
  });
  addEventListener('popstate', () => go(location.pathname + location.search, false));
}

let booted = false;
export function shell() {
  if (booted) { setActive(); return; }   // pages swap in without reloading, so the frame is built only once
  booted = true;
  const link = (href, key, text) => `<a href="${href}" data-nav="${key}">${text}</a>`;
  document.body.insertAdjacentHTML('afterbegin', '<div class="wrap"><nav aria-label="Main"><a class="logo" href="/dashboard"><img class="mark" src="/img/logo.png" alt="" width="44" height="44">Comet</a>' + link('/dashboard', 'dashboard', 'Home') + link('/scripts', 'scripts', 'Scripts') + link('/pastebin', 'pastebin', 'Pastebin') + '<a class="btn" href="/pastebin">Create Paste</a></nav></div>');
  document.body.insertAdjacentHTML('afterbegin', '<div class="aurora"><i></i><i></i><i></i></div><div class="mesh"></div><div class="glow"></div>');
  document.body.insertAdjacentHTML('beforeend', '<footer>Comet · Lua script hosting · <a href="/scripts">Scripts</a> · <a href="/pastebin">Pastebin</a></footer>');
  setActive();
  fx();
  startEffects();
  router();
  const intro_ = document.documentElement.classList.contains('intro');
  const ready = music(intro_);
  intro(ready);
}
