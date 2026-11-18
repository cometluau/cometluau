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

// Loops every track in /music forever and keeps its place when you move between pages.
async function music() {
  let tracks = [];
  try { tracks = (await api('/api/music')).tracks || []; } catch { return; }
  if (!tracks.length) return;
  const ls = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  let idx = Math.min(parseInt(ls('cm_track', '0'), 10) || 0, tracks.length - 1);
  const a = new Audio();
  a.preload = 'auto';
  a.volume = Math.min(1, Math.max(0, parseFloat(ls('cm_vol', '0.5'))));
  a.muted = ls('cm_muted', '0') === '1';
  a.loop = tracks.length === 1;
  const load = (i, t = 0) => {
    idx = (i + tracks.length) % tracks.length; set('cm_track', idx);
    a.src = tracks[idx].url;
    a.addEventListener('loadedmetadata', () => { if (t && t < (a.duration || 1e9)) a.currentTime = t; }, { once: true });
    name.textContent = tracks[idx].name; name.title = tracks[idx].name;
  };
  const box = document.createElement('div');
  box.className = 'player'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Music');
  box.innerHTML = '<button type="button" id="mp" aria-label="Play or pause"></button><span class="tn" id="mn"></span><button type="button" id="mx" aria-label="Next track">' + NEXT + '</button><button type="button" id="mm" aria-label="Mute"></button><input id="mv" type="range" min="0" max="1" step="0.01" aria-label="Volume">';
  document.body.append(box);
  const name = box.querySelector('#mn'), pp = box.querySelector('#mp'), mm = box.querySelector('#mm'), mv = box.querySelector('#mv');
  const paint = () => { pp.innerHTML = a.paused ? PLAY : PAUSE; mm.innerHTML = a.muted ? MUTE : VOL; mv.value = a.volume; };
  if (tracks.length < 2) box.querySelector('#mx').hidden = true;
  load(idx, parseFloat(ls('cm_time', '0')) || 0);
  paint();
  const start = () => a.play().then(paint).catch(() => {});
  const arm = () => {
    const go = () => { removeEventListener('pointerdown', go); removeEventListener('keydown', go); if (ls('cm_paused', '0') !== '1' && a.paused) start(); };
    addEventListener('pointerdown', go); addEventListener('keydown', go);
  };
  if (ls('cm_paused', '0') !== '1') a.play().then(paint).catch(arm);   // browsers block sound until the first click, so we wait for one
  pp.onclick = () => { if (a.paused) { set('cm_paused', '0'); start(); } else { a.pause(); set('cm_paused', '1'); paint(); } };
  box.querySelector('#mx').onclick = () => { load(idx + 1); if (ls('cm_paused', '0') !== '1') start(); };
  mm.onclick = () => { a.muted = !a.muted; set('cm_muted', a.muted ? '1' : '0'); paint(); };
  mv.oninput = () => { a.volume = +mv.value; a.muted = false; set('cm_vol', mv.value); set('cm_muted', '0'); paint(); };
  a.addEventListener('ended', () => { load(idx + 1); start(); });
  a.addEventListener('error', () => { if (tracks.length > 1) { load(idx + 1); start(); } });
  a.addEventListener('play', paint); a.addEventListener('pause', paint);
  let last = 0;
  a.addEventListener('timeupdate', () => { const n = Date.now(); if (n - last > 1000) { last = n; set('cm_time', a.currentTime.toFixed(1)); } });
  addEventListener('pagehide', () => set('cm_time', a.currentTime.toFixed(1)));
}

export function shell() {
  const here = location.pathname.replace(/\/+$/, '').split('/')[1] || '';
  const cur = (p) => (here === p ? ' aria-current="page"' : '');
  document.body.insertAdjacentHTML('afterbegin', '<div class="wrap"><nav aria-label="Main"><a class="logo" href="/dashboard"><img class="mark" src="/img/logo.png" alt="" width="44" height="44">Comet</a><a href="/dashboard"' + (here === 'dashboard' ? ' aria-current="page"' : '') + '>Home</a><a href="/scripts"' + cur('scripts') + '>Scripts</a><a href="/pastebin"' + cur('pastebin') + '>Pastebin</a><a class="btn" href="/pastebin">Create Paste</a></nav></div>');
  document.body.insertAdjacentHTML('afterbegin', '<div class="aurora"><i></i><i></i><i></i></div><div class="mesh"></div><div class="glow"></div>');
  document.body.insertAdjacentHTML('beforeend', '<footer>Comet · Lua script hosting · <a href="/scripts">Scripts</a> · <a href="/pastebin">Pastebin</a></footer>');
  fx();
  music();
}
