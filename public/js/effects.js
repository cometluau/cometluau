// Background comets, custom cursor (dot + gradient ring) and click effects. No libraries.
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const rand = (a, b) => a + Math.random() * (b - a);
const make = (tag, cls) => { const e = document.createElement(tag); e.className = cls; return e; };

/* ---------- comets and stars drifting down the background ---------- */
function sky() {
  const c = make('canvas', 'fx-canvas'); c.id = 'sky'; c.setAttribute('aria-hidden', 'true');
  document.body.prepend(c);
  const g = c.getContext('2d');
  let W = 0, H = 0, dpr = 1, stars = [], comets = [], next = 0.3, last = performance.now();
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 1.75);
    W = innerWidth; H = innerHeight;
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round((W * H) / 22000);
    stars = Array.from({ length: n }, () => ({ x: rand(0, W), y: rand(0, H), r: rand(0.4, 1.3), p: rand(0, 6.28), s: rand(0.6, 1.8), b: Math.random() < 0.35 }));
  };
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
  resize();
  const spawn = () => {
    const big = Math.random() < 0.14;
    const down = (Math.random() < 0.5 ? rand(58, 78) : rand(102, 122)) * Math.PI / 180;   // always travelling downward, slightly left or right
    const dx = Math.cos(down), dy = Math.sin(down);
    const tail = big ? rand(300, 460) : rand(130, 300);
    const x = rand(-0.05, 1.05) * W + (dx < 0 ? W * 0.22 : -W * 0.22);
    comets.push({ x, y: -tail * 0.4 - 20, dx, dy, v: big ? rand(560, 760) : rand(380, 820), tail, r: big ? rand(2.6, 3.6) : rand(1.3, 2.4), big });
  };
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    g.clearRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    for (const s of stars) {
      s.p += s.s * dt;
      const a = 0.18 + 0.32 * (0.5 + 0.5 * Math.sin(s.p));
      g.fillStyle = s.b ? `rgba(120,180,255,${a})` : `rgba(255,255,255,${a})`;
      g.beginPath(); g.arc(s.x, s.y, s.r, 0, 6.283); g.fill();
    }
    next -= dt;
    if (next <= 0 && comets.length < 7) { spawn(); next = rand(0.5, 2.1); }
    comets = comets.filter((m) => {
      m.x += m.dx * m.v * dt; m.y += m.dy * m.v * dt;
      const tx = m.x - m.dx * m.tail, ty = m.y - m.dy * m.tail;
      if (m.y - m.tail > H || m.x < -m.tail - 60 || m.x > W + m.tail + 60) return false;
      const nx = -m.dy, ny = m.dx, w = m.r * 1.5;            // tail is a tapered ribbon
      const grad = g.createLinearGradient(m.x, m.y, tx, ty);
      grad.addColorStop(0, 'rgba(255,255,255,.95)'); grad.addColorStop(0.18, 'rgba(160,205,255,.6)');
      grad.addColorStop(0.55, 'rgba(45,110,255,.22)'); grad.addColorStop(1, 'rgba(31,95,255,0)');
      g.fillStyle = grad;
      g.beginPath(); g.moveTo(m.x + nx * w, m.y + ny * w); g.lineTo(tx, ty); g.lineTo(m.x - nx * w, m.y - ny * w); g.closePath(); g.fill();
      const R = m.r * (m.big ? 9 : 7);                         // glowing head
      const hg = g.createRadialGradient(m.x, m.y, 0, m.x, m.y, R);
      hg.addColorStop(0, 'rgba(255,255,255,1)'); hg.addColorStop(0.3, 'rgba(150,200,255,.55)'); hg.addColorStop(1, 'rgba(31,95,255,0)');
      g.fillStyle = hg; g.beginPath(); g.arc(m.x, m.y, R, 0, 6.283); g.fill();
      return true;
    });
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/* ---------- cursor: a dot inside a ring whose white/blue gradient circles it like a snake ---------- */
const HOVER = 'a,button,input,select,textarea,summary,label,[role="button"],.item,.seg';
function cursor() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const dot = make('div', 'cursor-dot cur-el'), ring = make('div', 'cursor-ring cur-el');
  document.body.append(ring, dot);
  const root = document.documentElement;
  let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, k = 1, goal = 1, on = false, down = false;
  const show = (v) => { dot.style.opacity = ring.style.opacity = v ? 1 : 0; };
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    x = e.clientX; y = e.clientY;
    if (!on) { on = true; rx = x; ry = y; root.classList.add('cursor-on'); show(true); }
    dot.style.transform = `translate3d(${x}px,${y}px,0) scale(${down ? 0.7 : 1})`;
    goal = e.target.closest && e.target.closest(HOVER) ? 1.55 : 1;
  }, { passive: true });
  addEventListener('pointerdown', (e) => { if (e.pointerType !== 'touch') { down = true; dot.style.transform = `translate3d(${x}px,${y}px,0) scale(.7)`; } });
  addEventListener('pointerup', () => { down = false; dot.style.transform = `translate3d(${x}px,${y}px,0) scale(1)`; });
  root.addEventListener('mouseleave', () => show(false));
  root.addEventListener('mouseenter', () => on && show(true));
  const loop = () => {
    rx += (x - rx) * 0.2; ry += (y - ry) * 0.2;                 // the ring trails the dot slightly
    const t = down ? 0.78 : goal; k += (t - k) * 0.18;
    ring.style.transform = `translate3d(${rx}px,${ry}px,0) scale(${k.toFixed(3)})`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

/* ---------- click effect: expanding ring plus a burst of blue and white sparks ---------- */
function clicks() {
  const c = make('canvas', 'fx-canvas cur-el'); c.id = 'burst'; c.setAttribute('aria-hidden', 'true');
  document.body.append(c);
  const g = c.getContext('2d');
  let W = 0, H = 0, dpr = 1, parts = [], running = false, last = 0;
  const resize = () => { dpr = Math.min(devicePixelRatio || 1, 1.75); W = innerWidth; H = innerHeight; c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0); };
  resize(); addEventListener('resize', resize);
  const tick = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'lighter';
    parts = parts.filter((p) => {
      p.t += dt; if (p.t >= p.life) return false;
      const f = 1 - p.t / p.life, drag = Math.pow(0.04, dt);
      p.vx *= drag; p.vy = p.vy * drag + 180 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      g.strokeStyle = p.c.replace('A', (f * 0.9).toFixed(2)); g.lineWidth = p.w * f + 0.4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.045, p.y - p.vy * 0.045); g.stroke();
      return true;
    });
    if (parts.length) requestAnimationFrame(tick); else { running = false; g.clearRect(0, 0, W, H); }
  };
  addEventListener('pointerdown', (e) => {
    const ripple = make('div', 'click-ring cur-el'); ripple.style.left = e.clientX + 'px'; ripple.style.top = e.clientY + 'px';
    document.body.append(ripple); setTimeout(() => ripple.remove(), 700);
    if (calm()) return;
    const cols = ['rgba(255,255,255,A)', 'rgba(190,220,255,A)', 'rgba(77,163,255,A)', 'rgba(31,95,255,A)'];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * 6.283 + rand(-0.2, 0.2), v = rand(120, 340);
      parts.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.35, 0.7), t: 0, w: rand(1.2, 2.6), c: cols[i % 4] });
    }
    if (!running) { running = true; last = performance.now(); requestAnimationFrame(tick); }
  }, { passive: true });
}

export function startEffects() {
  if (!calm()) sky();
  cursor();
  clicks();
}
