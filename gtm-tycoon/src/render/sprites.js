// Procedural sprites ported from specs/art-bible.html. personGrid is pure (testable in Node);
// the draw helpers need a canvas.
import { PALETTE as P, SKIN } from '../core/config.js';

const W = 24, H = 30;

export function personGrid(o) {
  const g = [...Array(H)].map(() => Array(W).fill(null));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const hx = (x + 0.5 - 12) / 5.6, hy = (y + 0.5 - 9) / 6.4;
    if (hx * hx + hy * hy <= 1) {
      let c = 's';
      if (o.back) c = 'h';
      else if (y < 6) c = 'h';
      else if (y < 8 && (x < 9 || x > 14)) c = 'h';
      else if ((o.hair === 'long' || o.hair === 'short') && y < 11 && (x < 8 || x > 15)) c = 'h';
      g[y][x] = c;
    }
    if (o.hair === 'bun' && Math.hypot(x + 0.5 - 12, y + 0.5 - 2) < 2.6) g[y][x] = 'h';
    if (o.hair === 'cap' && y >= 2 && y <= 5 && x >= 6 && x <= 18) g[y][x] = 'p';
    if (o.hair === 'cap' && y === 5 && x >= 12 && x <= 20) g[y][x] = 'p';
    if (o.hair === 'long' && !o.back && y >= 9 && y <= 19 && (x === 6 || x === 7 || x === 16 || x === 17)) g[y][x] = 'h';
    if (y === 15 && x >= 10 && x <= 13) g[y][x] = o.back ? 'h' : 's';
    const body = y >= 16 && y <= H - 2 && x >= 5 && x <= 18 && !(y === 16 && (x < 7 || x > 16)) && !(y === 17 && (x < 6 || x > 17));
    if (body && g[y][x] !== 'h') g[y][x] = 'w';
    if (body && !o.back) { const off = Math.abs(x + 0.5 - 12), lim = (21 - y) * 0.7; if (y <= 20 && off <= lim && off > lim - 1.6) g[y][x] = 'c'; }
    if (o.tie && !o.back && body && x >= 11 && x <= 12 && y >= 18 && y <= 24) g[y][x] = 't';
    if (!o.back && body && x === 12 && y >= 21 && !o.tie) g[y][x] = 'k';
  }
  if (!o.back) { g[10][9] = 'k'; g[10][14] = 'k'; g[13][11] = 'm'; g[13][12] = 'm'; }
  const out = g.map(r => r.slice());
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (g[y][x]) continue;
    if ((g[y - 1] && g[y - 1][x]) || (g[y + 1] && g[y + 1][x]) || g[y][x - 1] || g[y][x + 1]) out[y][x] = 'k';
  }
  if (o.unknown) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (out[y][x] && out[y][x] !== 'k') out[y][x] = 'u';
    ['.kkk.', 'k...k', '....k', '..kk.', '..k..', '.....', '..k..'].forEach((r, dy) => [...r].forEach((ch, dx) => { if (ch === 'k') out[5 + dy][10 + dx] = 'q'; }));
  }
  return out;
}

const SHIRT = { ink: P.ink, graphite: P.graphite, pebble: P.pebble, marble: P.marble, indigo: P.indigo };

function personColors(o) {
  return { k: P.ink, s: SKIN[o.skin || 0], m: P.graphite, h: o.hairC || P.ink, w: SHIRT[o.shirt] || o.shirt || P.graphite, c: P.marble, u: P.pebble, q: P.marble, p: P.volt, t: P.signal };
}

const cache = new Map();
// Returns a 24x30 offscreen canvas for a person (cached by look).
export function personCanvas(o) {
  const k = JSON.stringify(o);
  if (cache.has(k)) return cache.get(k);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const colors = personColors(o);
  personGrid(o).forEach((row, y) => row.forEach((v, px) => { if (v) { x.fillStyle = colors[v]; x.fillRect(px, y, 1, 1); } }));
  cache.set(k, c);
  return c;
}

export function drawPerson(ctx, o, x, y, w = 24, h = 30) {
  ctx.drawImage(personCanvas(o), Math.round(x), Math.round(y), w, h);
}

// ---------- Lead icons ----------
function R(x, X, y, w, h, c) { x.fillStyle = c; x.fillRect(Math.round(X), Math.round(y), Math.round(w), Math.round(h)); }

function bag(x, cx, cy, u, ghost) {
  const M = ghost ? P.pebble : P.marble, V = ghost ? P.graphite : P.volt;
  R(x, cx - u * 2, cy - u * 5, u * 0.8, u * 2.4, M); R(x, cx + u * 1.2, cy - u * 5, u * 0.8, u * 2.4, M); R(x, cx - u * 2, cy - u * 5.6, u * 4, u * 0.8, M);
  R(x, cx - u * 4.5, cy - u * 2.8, u * 9, u * 7.8, V); R(x, cx - u * 4.5, cy - u * 2.8, u * 9, u * 0.8, M);
  R(x, cx - u * 2, cy + u * 0.2, u * 0.9, u * 0.9, P.ink); R(x, cx + u * 1.1, cy + u * 0.2, u * 0.9, u * 0.9, P.ink); R(x, cx - u * 1.4, cy + u * 2, u * 2.8, u * 0.7, P.ink);
}

// Draws a lead icon centered at (cx, cy). `u` is the pixel unit (company size scales it).
export function drawLeadIcon(x, lead, cx, cy, u, opts = {}) {
  if (opts.mystery) return drawMystery(x, cx, cy, u);
  const ind = lead.industry;
  if (ind === 'store') {
    if (lead.dupeOf) bag(x, cx + u * 2, cy - u * 1.5, u, true);
    bag(x, cx, cy, u);
  }
  if (ind === 'bank') {
    R(x, cx - u * 5, cy - u * 2, u * 10, u * 1.5, P.pebble);
    for (let i = 0; i < 4; i++) R(x, cx - u * 4.2 + i * u * 2.6, cy - u * 0.5, u * 1.2, u * 4, P.marble);
    R(x, cx - u * 5.5, cy + u * 3.5, u * 11, u * 1.5, P.pebble);
    for (let i = 0; i < 4; i++) { const w = u * (10 - i * 2.6); R(x, cx - w / 2, cy - u * (2.8 + i * 0.9), w, u * 0.9, P.pebble); }
  }
  if (ind === 'factory') {
    R(x, cx - u * 5, cy - u, u * 10, u * 6, P.pebble);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) R(x, cx - u * 5 + i * u * 3.33 + j * u, cy - u - (j + 1) * u, u * (3.33 - j), u, P.pebble);
    R(x, cx + u * 2.6, cy - u * 6, u * 1.6, u * 5, P.graphite);
    [-3.6, -0.8, 2].forEach(o => R(x, cx + u * o, cy + u, u * 1.6, u * 1.6, P.ink));
  }
  if (ind === 'hospital') {
    // Neutral cross: signal is reserved for mistakes, so the cross is graphite.
    R(x, cx - u * 5, cy - u * 4, u * 10, u * 9, P.marble);
    R(x, cx - u, cy - u * 3, u * 2, u * 5, P.graphite); R(x, cx - u * 2.5, cy - u * 1.5, u * 5, u * 2, P.graphite);
  }
  if (lead.bounced && (opts.blinkOn ?? true)) {
    R(x, cx + u * 2, cy - u * 6.5, u * 3.2, u * 3.2, P.signal);
    R(x, cx + u * 3.2, cy - u * 6, u * 0.8, u * 1.4, P.marble); R(x, cx + u * 3.2, cy - u * 4.2, u * 0.8, u * 0.6, P.marble);
  }
}

function drawMystery(x, cx, cy, u) {
  R(x, cx - u * 5, cy - u * 5, u * 10, u * 10, P.graphite);
  x.strokeStyle = P.marble; x.lineWidth = Math.max(1, u / 2); x.strokeRect(cx - u * 5, cy - u * 5, u * 10, u * 10);
  R(x, cx - u * 2, cy - u * 3.5, u * 4, u, P.marble); R(x, cx + u * 1.5, cy - u * 3, u, u * 2, P.marble);
  R(x, cx - u * 0.5, cy - u, u * 2, u, P.marble); R(x, cx - u * 0.5, cy, u, u * 1.5, P.marble); R(x, cx - u * 0.5, cy + u * 2.2, u, u, P.marble);
}

// ---------- Platform power icons (generic, volt frame) ----------
export function powerCanvas(kind, size = 90) {
  const c = document.createElement('canvas'); c.width = size; c.height = size;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.scale(size / 90, size / 90);
  const cx = 45, cy = 45, V = P.volt, M = P.marble;
  R(x, 0, 0, 90, 90, P.ink);
  R(x, cx - 30, cy - 30, 60, 60, P.graphite); x.strokeStyle = V; x.lineWidth = 3; x.strokeRect(cx - 30, cy - 30, 60, 60);
  if (kind === 'enrich') { R(x, cx - 2, cy - 22, 8, 18, V); R(x, cx - 10, cy - 6, 20, 6, V); R(x, cx - 6, cy, 8, 20, V); }
  if (kind === 'intent') { for (let r = 0; r < 3; r++) { x.strokeStyle = r === 0 ? V : M; x.lineWidth = 3; x.beginPath(); x.arc(cx, cy + 12, 8 + r * 8, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); } R(x, cx - 3, cy + 9, 6, 6, V); }
  if (kind === 'sequence') { for (let i = 0; i < 3; i++) { R(x, cx - 20 + i * 14, cy - 8, 10, 10, i === 2 ? V : M); if (i < 2) R(x, cx - 10 + i * 14, cy - 4, 4, 2, M); } R(x, cx - 20, cy + 10, 38, 4, M); }
  if (kind === 'crm') { for (let i = 0; i < 3; i++) { R(x, cx - 18, cy - 18 + i * 13, 36, 9, i === 0 ? V : M); R(x, cx - 14, cy - 15 + i * 13, 8, 3, P.ink); } }
  if (kind === 'icp') { for (let i = 0; i < 5; i++) R(x, cx - 20 + i * 4, cy - 16 + i * 6, 40 - i * 8, 5, i === 4 ? V : M); R(x, cx - 2, cy + 14, 4, 8, V); }
  if (kind === 'coffee') { R(x, cx - 14, cy - 8, 24, 26, M); R(x, cx + 10, cy - 2, 8, 4, M); R(x, cx + 14, cy - 2, 4, 14, M); R(x, cx + 10, cy + 8, 8, 4, M); R(x, cx - 10, cy - 4, 16, 6, V); R(x, cx - 8, cy - 22, 3, 8, M); R(x, cx, cy - 20, 3, 8, M); }
  if (kind === 'script') { R(x, cx - 16, cy - 20, 32, 40, M); for (let i = 0; i < 5; i++) R(x, cx - 11, cy - 13 + i * 7, i === 4 ? 12 : 22, 3, i === 0 ? V : P.ink); }
  return c;
}
