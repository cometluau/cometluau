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
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(data.error || 'Request failed'); e.status = r.status; throw e; }
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

export function shell() {
  document.body.insertAdjacentHTML('afterbegin', '<div class="wrap"><nav aria-label="Main"><a class="logo" href="/dashboard"><b>COMET</b> LUAU</a><a href="/dashboard">Home</a><a href="/pastebin">Pastebin</a><a class="btn" href="/pastebin">Create Paste</a></nav></div>');
  document.body.insertAdjacentHTML('afterbegin', '<div class="aurora"><i></i><i></i><i></i></div><div class="mesh"></div><div class="glow"></div>');
  document.body.insertAdjacentHTML('beforeend', '<footer>Comet Luau · Lua script hosting · <a href="/pastebin">Pastebin</a></footer>');
  fx();
}
