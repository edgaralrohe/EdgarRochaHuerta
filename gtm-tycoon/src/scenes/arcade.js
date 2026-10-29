// Pipeline Panic (world layer): catch the leads that fit today's rules, let the rest fall.
import { PALETTE as P, ARCADE_SECONDS, ARCADE_MINUTES } from '../core/config.js';
import { createArcade, stepArcade, ARCADE_W, ARCADE_H, CATCHER_Y } from '../core/arcade.js';
import { generateLeads } from '../core/leads.js';
import { createRng, hashSeed } from '../core/rng.js';
import { dayConfig } from '../core/days.js';
import { advanceClock } from '../core/clock.js';
import { recordCatch } from '../core/game.js';
import { hasPower } from '../core/upgrades.js';
import { drawLeadIcon, drawPerson } from '../render/sprites.js';
import { el, choose, setPanel, setOverlay, dialogBox, updateHud, showWorld, releaseFocus } from '../ui.js';
import { input } from '../input.js';
import { sfx } from '../audio.js';
import { settings } from '../settings.js';

const FONT = '"Press Start 2P", monospace';
const POP_TIME = 0.9;

export function ruleLines(day) {
  const r = dayConfig(day).rules;
  const lines = ['Catch online stores (the bag).', 'Skip banks, factories and hospitals.'];
  if (r.includes('size')) lines.push('Only 50 to 500 people: skip tiny and giant icons.');
  if (r.includes('data')) lines.push('Skip bounced (!) and duplicate (ghost) leads.');
  if (dayConfig(day).mystery) lines.push('Boxes (?) reveal halfway down.');
  return lines;
}

export function createArcadeScene(G) {
  let a = null, pops = [], pointerX = null, phase = 'intro', tally = { good: 0, bad: 0 }, shake = 0, blink = 0;

  async function intro() {
    phase = 'intro';
    const list = el('ul', { class: 'dialog', style: 'margin:0;padding-left:34px;font-size:22px' }, ruleLines(G.state.day).map(l => el('li', {}, l)));
    await choose('PIPELINE PANIC', `${ARCADE_SECONDS} seconds. Move with arrows, mouse or drag. Bad catches cost energy.`, [
      { label: '▶ START', value: 'go', primary: true },
    ], list);
    start();
  }

  function start() {
    const st = G.state, cfg = dayConfig(st.day);
    const leads = generateLeads(createRng(hashSeed(st.seed, st.day, 'leads')), st.day);
    a = createArcade({ leads, rules: cfg.rules, powers: st.powers, speed: cfg.speed, duration: ARCADE_SECONDS, rng: createRng(hashSeed(st.seed, st.day, 'drop')) });
    pops = []; tally = { good: 0, bad: 0 }; pointerX = null; phase = 'play';
    releaseFocus();
    setPanel(dialogBox('PIPELINE PANIC', 'Catch the good ones.', 'ARROWS OR A/D · MOUSE OR DRAG ON THE SCREEN'));
  }

  async function finish() {
    phase = 'done';
    const st = G.state;
    st.today.arcadeDone = true;
    advanceClock(st, ARCADE_MINUTES);
    updateHud(st);
    G.save();
    const text = tally.good
      ? `${tally.good} good ${tally.good === 1 ? 'lead' : 'leads'} in the pipeline, ${tally.bad} misfire${tally.bad === 1 ? '' : 's'}. Go call them.`
      : 'No good leads this round. Tomorrow’s inbox is a fresh start.';
    await choose('MARIANA', text, [{ label: 'BACK TO MAP', value: 'map', primary: true }]);
    G.go('map');
  }

  function handle(events) {
    const st = G.state;
    for (const e of events) {
      if (e.type === 'catch') {
        const r = recordCatch(st, e.lead, e.judgement);
        if (e.judgement.ok) {
          tally.good++; sfx('good');
          pops.push({ text: r.combo ? 'x3 COMBO' : 'GOOD LEAD', good: true, x: e.x, t: 0 });
        } else {
          tally.bad++; sfx('bad');
          pops.push({ text: e.judgement.label, good: false, x: e.x, t: 0 });
          if (!settings.reducedMotion && r.energyDelta < 0) shake = 0.2;
        }
        updateHud(st);
      }
      if (e.type === 'end') finish();
    }
  }

  function drawCheck(ctx, x, y, good) {
    ctx.fillStyle = good ? P.volt : P.signal;
    if (good) { ctx.fillRect(x, y + 3, 2, 2); ctx.fillRect(x + 2, y + 5, 2, 2); ctx.fillRect(x + 4, y + 3, 2, 2); ctx.fillRect(x + 6, y + 1, 2, 2); }
    else { for (let i = 0; i < 4; i++) { ctx.fillRect(x + i * 2, y + i * 2, 2, 2); ctx.fillRect(x + 6 - i * 2, y + i * 2, 2, 2); } }
  }

  const scene = {
    name: 'arcade',
    enter() {
      showWorld(); setOverlay(); a = null;
      intro();
    },
    update(dt) {
      blink += dt;
      if (shake > 0) shake = Math.max(0, shake - dt);
      for (const p of pops) p.t += dt;
      pops = pops.filter(p => p.t < POP_TIME);
      if (phase !== 'play' || !a) return;
      let x = pointerX;
      if (input.held.has('left')) { x = a.catcher.x - 60; pointerX = null; }
      if (input.held.has('right')) { x = a.catcher.x + 60; pointerX = null; }
      handle(stepArcade(a, dt, { x: x ?? a.catcher.x }));
    },
    render(ctx) {
      const st = G.state;
      ctx.setTransform(2, 0, 0, 2, 0, 0);
      const ox = shake > 0 ? (Math.floor(shake * 40) % 2 ? 2 : -2) : 0;
      ctx.translate(ox, 0);
      ctx.fillStyle = P.ink; ctx.fillRect(-4, 0, ARCADE_W + 8, ARCADE_H);
      // Lanes of limestone dots, like the city ground but on ink.
      ctx.fillStyle = P.graphite;
      for (let y = 20; y < ARCADE_H; y += 16) for (let x = 8; x < ARCADE_W; x += 16) ctx.fillRect(x, y, 1, 1);
      ctx.fillStyle = P.graphite; ctx.fillRect(0, CATCHER_Y + 10, ARCADE_W, 1);

      if (a) {
        const enrich = hasPower(st, 'enrich');
        for (const it of a.items) {
          const u = 2 * it.size;
          if (it.glow) { ctx.strokeStyle = P.volt; ctx.lineWidth = 1; ctx.strokeRect(Math.round(it.x - 13 * it.size) + 0.5, Math.round(it.y - 13 * it.size) + 0.5, Math.round(26 * it.size), Math.round(26 * it.size)); }
          ctx.globalAlpha = it.faded ? 0.35 : 1;
          const blinkOn = settings.reducedMotion || Math.floor(blink * 4) % 2 === 0;
          drawLeadIcon(ctx, it.lead, it.x, it.y, u, { mystery: !it.revealed && !enrich, blinkOn });
          ctx.globalAlpha = 1;
        }
        // Catcher: you, with the volt cap, holding the inbox tray.
        const cx = Math.round(a.catcher.x);
        drawPerson(ctx, { hair: 'cap', skin: 1, shirt: 'indigo' }, cx - 10, CATCHER_Y + 1, 20, 25);
        ctx.fillStyle = P.marble; ctx.fillRect(cx - a.catcher.w / 2, CATCHER_Y - 2, a.catcher.w, 5);
        ctx.fillStyle = P.limestone; ctx.fillRect(cx - a.catcher.w / 2, CATCHER_Y + 3, a.catcher.w, 1);
      }

      ctx.font = `8px ${FONT}`; ctx.textBaseline = 'middle';
      for (const p of pops) {
        const y = 170 - Math.floor((p.t / POP_TIME) * 4) * 6;
        const w = ctx.measureText(p.text).width + 18;
        const x = Math.max(2, Math.min(ARCADE_W - w - 2, Math.round(p.x - w / 2)));
        ctx.fillStyle = P.ink; ctx.fillRect(x, y - 7, w, 14);
        ctx.strokeStyle = p.good ? P.volt : P.signal; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y - 6.5, w - 1, 13);
        drawCheck(ctx, x + 4, y - 4, p.good);
        ctx.textAlign = 'left'; ctx.fillStyle = p.good ? P.volt : P.signal; ctx.fillText(p.text, x + 14, y + 1);
      }

      ctx.setTransform(2, 0, 0, 2, 0, 0);
      ctx.fillStyle = P.ink; ctx.fillRect(0, 0, ARCADE_W, 13);
      ctx.fillStyle = P.graphite; ctx.fillRect(0, 13, ARCADE_W, 1);
      ctx.font = `8px ${FONT}`; ctx.textBaseline = 'middle';
      const left = a ? Math.max(0, Math.ceil(a.duration - a.time)) : ARCADE_SECONDS;
      ctx.textAlign = 'left'; ctx.fillStyle = P.marble; ctx.fillText(`PIPELINE PANIC · 0:${String(left).padStart(2, '0')}`, 6, 7);
      ctx.textAlign = 'right'; ctx.fillStyle = tally.good ? P.volt : P.limestone; ctx.fillText(`CAUGHT ${tally.good}`, ARCADE_W - 6, 7);
    },
    onPointer(type, x) {
      if (phase === 'play' && (type === 'down' || type === 'move' || type === 'drag')) pointerX = x;
    },
    exit() { phase = 'done'; },
  };
  return scene;
}
