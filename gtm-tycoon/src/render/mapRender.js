// The hub city: warm monochrome, limestone streets, volt only where something is usable.
import { PALETTE as P } from '../core/config.js';
import { MAP_W, MAP_H, TILE as T, BUILDINGS, TREES, MAILBOXES } from '../core/map.js';
import { drawPerson } from './sprites.js';

const FONT = '"Press Start 2P", monospace';
let base = null;

const WALLS = { office: [P.indigo, P.ink], inbox: [P.graphite, P.ink], clients: [P.graphite, P.ink], gym: [P.ink, P.indigo] };

// Static layer, rendered once at 640x448 (x2) so labels stay crisp. Rebuilt when fonts load.
export function buildMapBase() {
  base = document.createElement('canvas'); base.width = MAP_W * T * 2; base.height = MAP_H * T * 2;
  const m = base.getContext('2d'); m.imageSmoothingEnabled = false; m.scale(2, 2);
  const r = (x, y, w, h, c) => { m.fillStyle = c; m.fillRect(x, y, w, h); };

  r(0, 0, MAP_W * T, MAP_H * T, P.marble);
  for (let y = 0; y < MAP_H * T; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < MAP_W * T; x += 8) r(x, y, 1, 1, P.limestone);
  r(0, 6 * T, MAP_W * T, 2 * T, P.limestone); r(9 * T, 0, 2 * T, MAP_H * T, P.limestone);
  for (let x = 0; x < MAP_W * T; x += 12) r(x, 7 * T - 1, 6, 2, P.marble);
  for (let y = 0; y < MAP_H * T; y += 12) r(10 * T - 1, y, 2, 6, P.marble);

  for (const b of BUILDINGS) {
    const [wall, roof] = WALLS[b.id];
    const x = b.x * T, y = b.y * T, w = b.w * T, h = b.h * T;
    r(x + 3, y + 3, w, h, P.ink);
    r(x, y, w, h, wall); r(x, y, w, 6, roof);
    for (let wy = y + 22; wy < y + h - 18; wy += 12) for (let wx = x + 6; wx < x + w - 8; wx += 12) r(wx, wy, 6, 6, P.limestone);
    const dx = (b.x + Math.floor(b.w / 2)) * T;
    r(dx + 2, y + h - 14, 12, 14, P.ink); r(dx + 10, y + h - 8, 2, 2, P.limestone);
  }
  for (const [tx, ty] of TREES) { const x = tx * T, y = ty * T; r(x + 6, y + 10, 4, 6, P.ink); r(x + 2, y + 2, 12, 10, P.graphite); r(x + 4, y, 8, 2, P.graphite); r(x + 3, y + 3, 3, 3, P.pebble); }
}

// Labels are 8 px logical (16 px on screen). Volt only when the thing is usable right now.
function label(ctx, text, cx, y, on) {
  ctx.font = `8px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width + 6;
  ctx.fillStyle = P.ink; ctx.fillRect(Math.round(cx - w / 2), y, Math.ceil(w), 11);
  ctx.fillStyle = on ? P.volt : P.marble; ctx.fillText(text, cx, y + 6);
}

function placeSigns(ctx, active) {
  for (const b of BUILDINGS) label(ctx, b.label, b.x * T + (b.w * T) / 2, b.y * T + 7, active.has(b.id));
  const on = active.has('inbox');
  for (const [tx, ty] of MAILBOXES) {
    const x = tx * T + 4, y = ty * T + 2;
    ctx.fillStyle = on ? P.volt : P.limestone; ctx.fillRect(x, y, 8, 8);
    ctx.fillStyle = P.ink; ctx.fillRect(x, y, 8, 2); ctx.fillRect(x + 3, y + 8, 2, 5);
  }
}

// view: { people: [{ o, px, py, label, on }], player: { px, py, back, bob }, active: Set<placeId>, hudLeft, hudRight, hudOn }
export function drawMap(ctx, view) {
  if (!base) buildMapBase();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(base, 0, 0);
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  placeSigns(ctx, view.active || new Set());
  const all = [...view.people.map(p => ({ ...p, kind: 'npc' })), { ...view.player, kind: 'player' }].sort((a, b) => a.py - b.py);
  for (const p of all) {
    if (p.kind === 'player') drawPerson(ctx, { hair: 'cap', skin: 1, shirt: 'indigo', back: p.back }, p.px + 2, p.py + 1 - (p.bob || 0), 12, 15);
    else drawPerson(ctx, p.o, p.px + 2, p.py + 1, 12, 15);
  }
  for (const p of all) {
    if (p.kind === 'player') label(ctx, 'YOU', p.px + 8, p.py - 11 - (p.bob || 0), true);
    else if (p.label) label(ctx, p.label, p.px + 8, p.py - 11, p.on);
  }
  ctx.fillStyle = P.ink; ctx.fillRect(0, 0, MAP_W * T, 12);
  ctx.font = `8px ${FONT}`; ctx.textBaseline = 'middle';
  ctx.textAlign = 'left'; ctx.fillStyle = P.marble; ctx.fillText(view.hudLeft, 6, 7);
  ctx.textAlign = 'right'; ctx.fillStyle = view.hudOn ? P.volt : P.limestone; ctx.fillText(view.hudRight, MAP_W * T - 6, 7);
}
