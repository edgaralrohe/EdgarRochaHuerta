import { judgeLead, isBadFit } from './leads.js';

// Pipeline Panic simulation in logical pixels (drawn x2 on a 640x448 canvas).
export const ARCADE_W = 320;
export const ARCADE_H = 224;
export const CATCHER_Y = 196;
const CATCHER_W = 44;
const CATCHER_SPEED = 300;
const FALL_SPEED = 76;
const REVEAL_AT = ARCADE_H * 0.4;
const SCALE = { tiny: 0.55, mid: 1, giant: 1.35 };

export function createArcade({ leads, rules, powers = [], speed = 1, duration = 45, rng }) {
  const spawnWindow = Math.max(1, duration - 5);
  const queue = leads.map((lead, i) => ({ lead, at: 0.6 + (i * spawnWindow) / Math.max(1, leads.length), x: rng.int(22, ARCADE_W - 22) }));
  return {
    rules, powers, speed, duration, time: 0, done: false,
    queue, items: [], catcher: { x: ARCADE_W / 2, w: CATCHER_W },
  };
}

function spawn(a, q) {
  const { lead } = q;
  a.items.push({
    lead, x: q.x, y: -12, size: SCALE[lead.size] || 1,
    revealed: !lead.mystery || a.powers.includes('enrich'),
    faded: a.powers.includes('icp') && isBadFit(lead),
    glow: a.powers.includes('intent') && lead.intent && !isBadFit(lead),
  });
}

export function stepArcade(a, dt, input = {}) {
  const events = [];
  if (a.done) return events;
  a.time += dt;

  if (typeof input.x === 'number') {
    const target = Math.max(a.catcher.w / 2, Math.min(ARCADE_W - a.catcher.w / 2, input.x));
    const max = CATCHER_SPEED * dt;
    a.catcher.x += Math.max(-max, Math.min(max, target - a.catcher.x));
  }

  while (a.queue.length && a.queue[0].at <= a.time) spawn(a, a.queue.shift());

  const fall = FALL_SPEED * a.speed * dt;
  for (const it of [...a.items]) {
    const prevY = it.y;
    it.y += fall;
    if (!it.revealed && it.y >= REVEAL_AT) { it.revealed = true; events.push({ type: 'reveal', item: it }); }
    const reach = a.catcher.w / 2 + 8 * it.size;
    if (prevY < CATCHER_Y && it.y >= CATCHER_Y && Math.abs(it.x - a.catcher.x) <= reach) {
      a.items.splice(a.items.indexOf(it), 1);
      events.push({ type: 'catch', lead: it.lead, judgement: judgeLead(it.lead, a.rules), x: it.x });
    } else if (it.y > ARCADE_H + 16) {
      a.items.splice(a.items.indexOf(it), 1);
      events.push({ type: 'miss', lead: it.lead });
    }
  }

  if (a.time >= a.duration || (!a.queue.length && !a.items.length && a.time > 1)) {
    a.done = true;
    events.push({ type: 'end' });
  }
  return events;
}
