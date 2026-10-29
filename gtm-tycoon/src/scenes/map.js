// Hub map (world layer): walk between Office, Inbox Plaza, Clients and Gym.
import { TILE as T, DOORS, NPC, CLIENT_SPOTS, PLAYER_START, isWalkable, doorAt, findPath } from '../core/map.js';
import { dayConfig } from '../core/days.js';
import { formatClock, isDayOver } from '../core/clock.js';
import { canCall, gymDrill, beginRival } from '../core/game.js';
import { hasPower } from '../core/upgrades.js';
import { drawMap } from '../render/mapRender.js';
import { TITLE_TAG } from '../core/names.js';
import { el, say, choose, setPanel, setOverlay, dialogBox, releaseFocus, updateHud, showWorld } from '../ui.js';
import { input } from '../input.js';
import { sfx } from '../audio.js';
import { settings } from '../settings.js';
import { clientsMenu } from './clients.js';

const STEP_TIME = 0.14;
const DIRS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
const MARIANA = { hair: 'bun', skin: 2, shirt: 'indigo' };
const RIVAL = { hair: 'short', skin: 0, shirt: 'ink', hairC: '#47423d', tie: true };

export function createMapScene(G) {
  let pos = { ...PLAYER_START }, from = null, t = 0, back = false, path = [], busy = false, pendingTalk = null;

  const rivalHere = () => G.state.day >= 2 && !G.state.today.rivalDone;
  const npcTiles = () => {
    const set = new Set([`${NPC.mariana.x},${NPC.mariana.y}`]);
    if (rivalHere()) set.add(`${NPC.rival.x},${NPC.rival.y}`);
    return set;
  };
  const npcAt = (x, y) => (x === NPC.mariana.x && y === NPC.mariana.y ? 'mariana' : rivalHere() && x === NPC.rival.x && y === NPC.rival.y ? 'rival' : null);

  // What the player should do next, said by the coach in one sentence.
  function idleHint() {
    const st = G.state, td = st.today;
    if (isDayOver(st)) return 'It is 6:00 PM. Wrap the day at the Office.';
    if (!td.arcadeDone) return 'Start at Inbox Plaza. Catch today’s leads.';
    if (st.pipeline.length && canCall(st).ok) return `Call your ${st.pipeline.length === 1 ? 'lead' : 'leads'} at Clients.`;
    if (!td.gymDone && st.pitchLevel < 3) return 'The Gym sharpens your pitch.';
    if (rivalHere() && canCall(st).ok) return 'Your rival is on the street. Pitch-off for a deal.';
    return 'Day is done. Close it at the Office.';
  }

  function idle() {
    busy = false;
    updateHud(G.state);
    releaseFocus();
    setPanel(dialogBox('TODAY', idleHint(), 'ARROWS OR WASD TO WALK · TAP A PLACE TO GO THERE · WALK INTO SOMEONE TO TALK'));
    G.save();
  }

  // Runs a modal flow, then returns control to the map.
  async function modal(fn) {
    busy = true; path = []; pendingTalk = null; input.clear();
    try { await fn(); } finally { if (G.scene === scene) idle(); }
  }

  function stepOutOfDoor(id) {
    const d = DOORS[id];
    pos = { x: d.x, y: d.y + 1 }; from = null; back = false;
  }

  async function enterPlace(id) {
    const st = G.state;
    if (id === 'inbox') {
      if (st.today.arcadeDone) { await say('MARIANA', 'Inbox is clear. Go call your leads.'); stepOutOfDoor(id); return; }
      if (isDayOver(st)) { await say('MARIANA', 'Inbox closed at 6:00 PM. Head to the Office.'); stepOutOfDoor(id); return; }
      stepOutOfDoor(id);
      G.go('arcade');
      return;
    }
    if (id === 'clients') {
      stepOutOfDoor(id);
      await clientsMenu(G, scene);
      return;
    }
    if (id === 'gym') {
      stepOutOfDoor(id);
      const table = el('table', { class: 'table', 'aria-label': 'Which pitch works on whom' },
        el('tr', {}, el('th', {}, 'BUYER'), el('th', {}, 'BEST PITCH')),
        el('tr', {}, el('td', {}, '$ VISIONARY'), el('td', { class: 'good' }, '$ IMPACT')),
        el('tr', {}, el('td', {}, '# TECHNICAL'), el('td', { class: 'good' }, '# DEMO')),
        el('tr', {}, el('td', {}, '+ OPERATOR'), el('td', { class: 'good' }, '+ WORKFLOW')),
        el('tr', {}, el('td', {}, '= GATEKEEPER'), el('td', { class: 'good' }, '= FIND MANAGER')));
      const can = !st.today.gymDone && st.pitchLevel < 3 && !isDayOver(st);
      const text = st.pitchLevel >= 3 ? 'Your pitch is at its peak. Use it.' : st.today.gymDone ? 'Good work today. Come back tomorrow.' : `Pitch level ${st.pitchLevel} of 3. One drill a day.`;
      const pick = await choose('COACH', text, [
        { label: 'COACH DRILL', sub: '60 min · pitch +1', value: 'drill', primary: can, disabled: !can },
        { label: 'LEAVE', value: 'leave' },
      ], table);
      if (pick === 'drill' && gymDrill(st).ok) { sfx('good'); updateHud(st); await say('COACH', `Pitch level ${st.pitchLevel}. Every pitch now lands harder.`); }
      return;
    }
    if (id === 'office') {
      stepOutOfDoor(id);
      const pick = await choose('MARIANA', isDayOver(st) ? 'That is the day. Let’s see the numbers.' : `It is ${formatClock(st.minutes)}. Close the day now?`, [
        { label: 'END DAY', value: 'end', primary: true },
        ...(isDayOver(st) ? [] : [{ label: 'NOT YET', value: 'stay' }]),
      ]);
      if (pick === 'end') G.go('office');
    }
  }

  async function talk(who) {
    const st = G.state;
    if (who === 'mariana') {
      await say('MARIANA · CO-FOUNDER', dayConfig(st.day).morningLine);
      return;
    }
    if (who === 'rival') {
      if (!canCall(st).ok) { await say('RIVAL', 'Out of gas already? See you tomorrow.'); return; }
      const pick = await choose('RIVAL', 'Same account, same morning. Pitch-off?', [
        { label: 'PITCH-OFF', sub: '30 min · 10 energy', value: 'go', primary: true },
        { label: 'NOT NOW', value: 'no' },
      ]);
      if (pick === 'go' && beginRival(st).ok) G.go('battle', { rival: true });
    }
  }

  function tryMove(dx, dy) {
    const nx = pos.x + dx, ny = pos.y + dy;
    back = dy < 0 ? true : dy > 0 ? false : back;
    const who = npcAt(nx, ny);
    if (who) { modal(() => talk(who)); return false; }
    if (!isWalkable(nx, ny)) return false;
    from = { ...pos }; pos = { x: nx, y: ny }; t = 0;
    if (settings.sound) sfx('step');
    return true;
  }

  function arrive() {
    from = null;
    const door = doorAt(pos.x, pos.y);
    if (door) { modal(() => enterPlace(door)); return; }
    if (!path.length && pendingTalk) {
      const who = pendingTalk; pendingTalk = null;
      const n = NPC[who];
      if (Math.abs(n.x - pos.x) + Math.abs(n.y - pos.y) === 1) modal(() => talk(who));
    }
  }

  function walkTo(tx, ty) {
    const who = npcAt(tx, ty);
    const blocked = npcTiles();
    if (who) {
      const options = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: tx + dx, y: ty + dy }))
        .filter(p => isWalkable(p.x, p.y, blocked) && !doorAt(p.x, p.y));
      if (options.some(o => o.x === pos.x && o.y === pos.y)) { modal(() => talk(who)); return; }
      const best = options.map(o => findPath(pos, o, blocked)).filter(Boolean).sort((a, b) => a.length - b.length)[0];
      if (best) { path = best; pendingTalk = who; }
      return;
    }
    // Tapping a building walks to its door.
    const place = Object.entries(DOORS).find(([, d]) => tx >= d.x - 3 && tx <= d.x + 3 && ty <= d.y && ty >= d.y - 3 && !isWalkable(tx, ty));
    const target = place ? place[1] : { x: tx, y: ty };
    const p = findPath(pos, target, blocked);
    if (p) { path = p; pendingTalk = null; }
  }

  function people() {
    const st = G.state, enrich = hasPower(st, 'enrich'), intent = hasPower(st, 'intent');
    const list = st.pipeline.slice(0, CLIENT_SPOTS.length).map((l, i) => {
      const [x, y] = CLIENT_SPOTS[i];
      const unknown = l.mystery && !enrich;
      return { o: unknown ? { hair: 'short', unknown: true } : { hair: l.buyer.hair, skin: l.buyer.skin, shirt: l.buyer.shirt }, px: x * T, py: y * T,
        label: unknown ? '?' : TITLE_TAG[l.buyer.title] || '?', on: intent && l.intent };
    });
    list.push({ o: MARIANA, px: NPC.mariana.x * T, py: NPC.mariana.y * T, label: 'MARIANA', on: false });
    if (rivalHere()) list.push({ o: RIVAL, px: NPC.rival.x * T, py: NPC.rival.y * T, label: 'RIVAL', on: false });
    return list;
  }

  function activePlaces() {
    const st = G.state, td = st.today, a = new Set();
    if (isDayOver(st)) { a.add('office'); return a; }
    if (!td.arcadeDone) a.add('inbox');
    if (st.pipeline.length && canCall(st).ok) a.add('clients');
    if (!td.gymDone && st.pitchLevel < 3) a.add('gym');
    if (!a.size) a.add('office');
    return a;
  }

  const scene = {
    name: 'map',
    async enter(params = {}) {
      showWorld(); setOverlay();
      if (params.newDay) { pos = { ...PLAYER_START }; from = null; path = []; }
      idle();
      if (params.newDay) await modal(() => say('MARIANA · CO-FOUNDER', dayConfig(G.state.day).morningLine));
      if (isDayOver(G.state)) { dayOver(); return; }
      if (params.openClients) await modal(() => clientsMenu(G, scene));
    },
    update(dt) {
      if (busy) return;
      if (from) {
        t += dt;
        if (t >= STEP_TIME) arrive();
        return;
      }
      for (const [k, [dx, dy]] of Object.entries(DIRS)) {
        if (input.held.has(k)) { path = []; pendingTalk = null; tryMove(dx, dy); return; }
      }
      if (path.length) {
        const next = path.shift();
        if (!tryMove(next.x - pos.x, next.y - pos.y)) path = [];
        return;
      }
      if (input.pressed.has('confirm')) {
        const fx = pos.x, fy = pos.y + (back ? -1 : 1);
        const who = npcAt(fx, fy);
        if (who) modal(() => talk(who));
      }
    },
    render(ctx) {
      const st = G.state;
      // Steps, not tweens: the walk moves in 4 px increments.
      const k = from ? Math.min(1, Math.floor((t / STEP_TIME) * 4) / 4) : 1;
      const fx = from ? from.x : pos.x, fy = from ? from.y : pos.y;
      const px = (fx + (pos.x - fx) * k) * T, py = (fy + (pos.y - fy) * k) * T;
      const bob = from && !settings.reducedMotion && k === 0.5 ? 1 : 0;
      const n = st.pipeline.length;
      drawMap(ctx, {
        people: people(), player: { px, py, back, bob }, active: activePlaces(),
        hudLeft: `DAY ${st.day} · ${formatClock(st.minutes)}`,
        hudRight: n ? `${n} ${n === 1 ? 'LEAD' : 'LEADS'} TO CALL` : 'NO LEADS YET', hudOn: n > 0,
      });
    },
    onPointer(type, x, y) {
      if (type !== 'down' || busy) return;
      walkTo(Math.floor(x / T), Math.floor(y / T));
    },
    exit() { busy = true; },
  };

  function dayOver() {
    if (busy) return;
    modal(async () => {
      await say('MARIANA', 'It is 6:00 PM. Let’s close the day.');
      G.go('office');
    });
  }
  scene.checkDayOver = () => { if (isDayOver(G.state)) dayOver(); };
  return scene;
}
