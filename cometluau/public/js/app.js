export const $ = (s, r = document) => r.querySelector(s);
const KW = new Set('and break do else elseif end false for function goto if in local nil not or repeat return then true until while continue'.split(' '));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function highlight(src) {
  const re = /(--\[(=*)\[[\s\S]*?\]\2\]|--[^\n]*)|(\[(=*)\[[\s\S]*?\]\4\]|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(\b\d[\w.]*)|([A-Za-z_]\w*)/g;
  let out = '', i = 0, m;
  while ((m = re.exec(src))) {
    out += esc(src.slice(i, m.index));
    const t = esc(m[0]);
    out += m[1] ? `<span class="c">${t}</span>` : m[3] ? `<span class="s">${t}</span>` : m[5] ? `<span class="n">${t}</span>` : m[6] && KW.has(m[0]) ? `<span class="k">${t}</span>` : t;
    i = re.lastIndex;
  }
  return out + esc(src.slice(i));
}
export function codeBox(src) {
  const n = src.split('\n').length;
  return `<div class="codebox"><pre class="gutter">${Array.from({ length: n }, (_, i) => i + 1).join('\n')}</pre><pre><code>${highlight(src)}</code></pre></div>`;
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
  if (!r.ok) throw new Error(data.error || 'Request failed');
  return data;
}
export function shell() {
  document.body.insertAdjacentHTML('afterbegin', '<div class="wrap"><nav aria-label="Main"><a class="logo" href="/dashboard"><b>COMET</b> LUAU</a><a href="/dashboard">Home</a><a href="/pastebin">Pastebin</a><a class="btn" href="/pastebin">Create Paste</a></nav></div>');
  document.body.insertAdjacentHTML('beforeend', '<footer>Comet Luau · Lua script hosting · <a href="/pastebin">Pastebin</a></footer>');
}
