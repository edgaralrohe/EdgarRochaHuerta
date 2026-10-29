// Calls as turn-based pitch battles (world layer). Also the Rival pitch-off.
import { PALETTE as P, RIVAL_DEAL } from '../core/config.js';
import { createBattle, applyMove, MOVES } from '../core/battle.js';
import { createRng, hashSeed } from '../core/rng.js';
import { personName, TITLES } from '../core/names.js';
import { resolveCall, resolveRival, canCall } from '../core/game.js';
import { hasPower } from '../core/upgrades.js';
import { drawPerson } from '../render/sprites.js';
import { el, say, choose, setPanel, setOverlay, dialogBox, button, updateHud, showWorld, moneyShort } from '../ui.js';
import { sfx } from '../audio.js';
import { settings } from '../settings.js';
import { TYPE_BADGE } from './clients.js';

const FONT = '"Press Start 2P", monospace';
const MOVE_ICON = { IMPACT: '$', DEMO: '#', WORKFLOW: '+', 'FIND MANAGER': '=' };
const MOVE_SUB = { IMPACT: 'Lead with the number', DEMO: 'Show it working', WORKFLOW: 'Show hours saved', 'FIND MANAGER': 'Ask for the buyer' };
const RIVAL_LOOK = { hair: 'short', skin: 0, shirt: 'ink', hairC: '#47423d', tie: true };

function rivalProspect(state) {
  const rng = createRng(hashSeed(state.seed, state.day, 'rival'));
  const type = rng.pick(['visionary', 'technical', 'operator']);
  return { id: 'rival', company: 'Harbor Outfitters', value: RIVAL_DEAL, intent: false, mystery: false,
    buyer: { name: personName(rng), title: rng.pick(TITLES[type]), type, skin: rng.int(0, 2), hair: rng.pick(['short', 'long', 'bun']), shirt: rng.pick(['ink', 'graphite', 'pebble']) } };
}

export function createBattleScene(G) {
  let b = null, lead = null, rival = false, pop = null, flash = 0, busy = false;

  function card() {
    const pips = Array.from({ length: Math.min(b.maxPatience, 8) }, (_, i) => el('s', { class: i < b.patience ? null : 'off' }));
    const badge = b.revealed ? TYPE_BADGE[b.type] : 'TYPE ???';
    return el('div', { class: 'battle', role: 'group', 'aria-label': 'Call status' },
      el('div', { class: 'n' }, el('span', {}, b.name.toUpperCase()), el('span', {}, b.title.toUpperCase())),
      el('div', { class: 'co' }, `${b.company} · ${moneyShort(b.value)}`),
      el('div', { class: 'row' }, el('span', { class: 'badge' }, badge),
        rival ? null : el('span', { class: 'pat', 'aria-label': `Patience ${b.patience} of ${b.maxPatience}` }, 'PAT ', pips)),
      el('div', { class: 'lb' }, el('span', {}, 'RESIST'), el('span', {}, `${b.resist}/${b.maxResist}`)),
      el('div', { class: 'b' }, el('i', { style: `width:${(b.resist / b.maxResist) * 100}%` })),
      rival && el('div', { class: 'lb' }, el('span', {}, 'RIVAL'), el('span', {}, `${b.rivalProgress}/${b.rivalMax}`)),
      rival && el('div', { class: 'b rival' }, el('i', { style: `width:${(b.rivalProgress / b.rivalMax) * 100}%` })));
  }

  function movesPanel(coach) {
    setOverlay(card());
    const btns = el('div', { class: 'btns grid2' }, MOVES.map((m, i) =>
      button(`${MOVE_ICON[m]} ${m}`, { key: String(i + 1), sub: MOVE_SUB[m], onClick: () => play(m) })));
    setPanel(dialogBox(rival ? 'PITCH-OFF' : 'COACH', coach), btns);
    setTimeout(() => { const f = btns.querySelector('button'); if (f) f.focus({ preventScroll: true }); }, 120);
  }

  async function play(move) {
    if (busy || !b || b.outcome) return;
    busy = true;
    const r = applyMove(b, move);
    sfx(r.effect === 'STRONG' ? 'strong' : r.effect === 'WEAK' || r.effect === 'NONE' ? 'weak' : 'hit');
    const words = { STRONG: 'STRONG PITCH', OK: 'IT LANDS', WEAK: 'WEAK PITCH', NONE: 'NO EFFECT', TRANSFER: 'NEW CONTACT' };
    pop = { text: words[r.effect], good: r.effect === 'STRONG' || r.effect === 'TRANSFER', t: 0 };
    if (r.effect === 'STRONG' && !settings.reducedMotion) flash = 0.15;
    setOverlay(card());
    if (!r.outcome) { busy = false; movesPanel(r.coach); return; }
    await finish(r);
  }

  async function finish(r) {
    const st = G.state;
    let title, line, good;
    if (rival) {
      resolveRival(st, r.outcome);
      good = r.outcome === 'won';
      title = good ? 'DEAL SIGNED' : 'RIVAL SIGNED';
      line = good ? `You beat the rival to ${b.company}.` : 'The rival closed first. Match the buyer faster next time.';
    } else {
      const res = resolveCall(st, lead.id, r.outcome);
      good = res === 'won';
      title = good ? 'DEAL SIGNED' : res === 'followup' ? 'FOLLOW-UP' : 'NO DEAL';
      line = good ? `${b.company} signed. ${moneyShort(b.value)} toward quota.`
        : res === 'followup' ? 'Sequence will bring them back. Try a different pitch.'
          : 'They ran out of patience. Match the pitch to the buyer.';
    }
    sfx(good ? 'deal' : 'lost');
    pop = { text: title, good, t: 0, big: true };
    updateHud(st);
    setOverlay(card());
    G.save();
    const more = !rival && st.pipeline.length > 0 && canCall(st).ok;
    const pick = await choose(good ? 'COACH' : 'COACH', line, [
      ...(more ? [{ label: '▶ NEXT CALL', value: 'next', primary: true }] : []),
      { label: 'BACK TO MAP', value: 'map', primary: !more },
    ]);
    G.go('map', { openClients: pick === 'next' });
  }

  function onKey(e) {
    if (G.scene !== scene || busy) return;
    const i = Number(e.key) - 1;
    if (i >= 0 && i < MOVES.length && b && !b.outcome) { e.preventDefault(); play(MOVES[i]); }
  }
  addEventListener('keydown', onKey);

  const scene = {
    name: 'battle',
    async enter(params = {}) {
      showWorld();
      const st = G.state;
      rival = !!params.rival;
      lead = rival ? rivalProspect(st) : st.pipeline.find(l => l.id === params.leadId);
      if (!lead) { G.go('map'); return; }
      b = createBattle({ lead, powers: st.powers, pitchLevel: st.pitchLevel, rival, rng: createRng(hashSeed(st.seed, st.day, lead.id, 'call')) });
      pop = null; flash = 0; busy = true;
      setOverlay(card());
      updateHud(st);
      if (rival) await say('RIVAL', 'Same buyer, two reps. First to close wins.');
      else if (b.type === 'gatekeeper' && b.revealed) await say('COACH', 'A gatekeeper picked up. They can’t sign.');
      busy = false;
      const hint = rival ? 'Read the badge and pick the pitch that fits.'
        : b.revealed ? `${b.title} on the line. Pick the pitch that fits.`
          : `${b.title} on the line. The title is your clue.`;
      movesPanel(hint);
    },
    update(dt) {
      if (pop) { pop.t += dt; if (pop.t > (pop.big ? 99 : 1)) pop = null; }
      if (flash > 0) flash = Math.max(0, flash - dt);
    },
    render(ctx) {
      ctx.setTransform(2, 0, 0, 2, 0, 0);
      ctx.fillStyle = P.marble; ctx.fillRect(0, 0, 320, 224);
      for (let y = 0; y < 224; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < 320; x += 8) { ctx.fillStyle = P.limestone; ctx.fillRect(x, y, 1, 1); }
      ctx.fillStyle = P.limestone; ctx.fillRect(196, 124, 104, 10); ctx.fillRect(20, 200, 110, 10);
      ctx.fillStyle = P.ink; ctx.fillRect(196, 134, 104, 3); ctx.fillRect(20, 210, 110, 3);
      if (!b) return;
      const st = G.state;
      const unknown = lead.mystery && !hasPower(st, 'enrich') && !b.revealed;
      const look = unknown ? { hair: 'short', unknown: true } : { hair: lead.buyer.hair, skin: lead.buyer.skin, shirt: lead.buyer.shirt };
      drawPerson(ctx, look, 212, 42, 72, 90);
      if (rival) drawPerson(ctx, RIVAL_LOOK, 150, 76, 40, 50);
      drawPerson(ctx, { hair: 'cap', skin: 1, shirt: 'indigo', back: true }, 44, 118, 72, 90);
      if (flash > 0) { ctx.fillStyle = P.volt; ctx.fillRect(196, 36, 104, 4); }
      if (pop) {
        ctx.font = `${pop.big ? 12 : 8}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const w = ctx.measureText(pop.text).width + 16, h = pop.big ? 24 : 16;
        const x = pop.big ? 160 : 248, y = pop.big ? 156 : 152;
        ctx.fillStyle = P.ink; ctx.fillRect(Math.round(x - w / 2), y - h / 2, Math.round(w), h);
        ctx.fillStyle = pop.good ? P.volt : (pop.big ? P.signal : P.limestone);
        ctx.fillText(pop.text, x, y + 1);
      }
    },
    exit() { setOverlay(); b = null; busy = false; },
  };
  return scene;
}
