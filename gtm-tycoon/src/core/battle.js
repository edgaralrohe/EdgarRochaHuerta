import { personName, TITLES } from './names.js';
import { BASE_POWER, BASE_RESIST, INTENT_RESIST, BASE_PATIENCE, RIVAL_STEP } from './config.js';

// A strong match (x2 on the chart) lands 2.4x so two good pitches close a deal.
const STRONG_MULT = 2.4;

export const MOVES = ['IMPACT', 'DEMO', 'WORKFLOW', 'FIND MANAGER'];

const CHART = {
  visionary: { IMPACT: 2, DEMO: 0.5, WORKFLOW: 1 },
  technical: { IMPACT: 0.5, DEMO: 2, WORKFLOW: 1 },
  operator: { IMPACT: 0.5, DEMO: 1, WORKFLOW: 2 },
  gatekeeper: { IMPACT: 0.5, DEMO: 0.5, WORKFLOW: 0.5 },
};

// One short sentence per box, in the coach's voice. Never blame the player.
const COACH = {
  visionary: { STRONG: 'Executives buy impact. Lead with the number.', WEAK: 'A CFO wants the outcome, not the specs.', OK: 'Fair point. Put a number on it.' },
  technical: { STRONG: 'Show the integration. Tech buyers trust proof.', WEAK: 'IT wants to see it work, not the revenue slide.', OK: 'Close. Show how it plugs in.' },
  operator: { STRONG: 'Ops buys time back. Show the workflow.', WEAK: 'Ops lives in the day-to-day. Skip the board deck.', OK: 'Good. Now show the hours saved.' },
  gatekeeper: { WEAK: "A receptionist can't buy. Find the manager." },
  transfer: 'Good move. You are now talking to the buyer.',
  noTransfer: 'They are the buyer. Pitch them.',
};

export function effectiveness(type, move) {
  if (move === 'FIND MANAGER') return type === 'gatekeeper' ? 'transfer' : 0;
  return CHART[type][move];
}

export function createBattle({ lead, powers = [], pitchLevel = 0, rival = false, rng }) {
  const resist = lead.intent ? INTENT_RESIST : BASE_RESIST;
  const patience = rival ? 99 : BASE_PATIENCE + (powers.includes('script') ? 1 : 0);
  return {
    leadId: lead.id, name: lead.buyer.name, title: lead.buyer.title, company: lead.company, value: lead.value,
    type: lead.buyer.type, revealed: powers.includes('enrich') || rival,
    resist, maxResist: resist, patience, maxPatience: patience,
    power: BASE_POWER + pitchLevel, rival, rivalProgress: 0, rivalMax: BASE_RESIST,
    outcome: null, turns: 0, rng,
  };
}

export function applyMove(b, move) {
  if (b.outcome) return { damage: 0, effect: 'NONE', coach: '', outcome: b.outcome, revealed: b.revealed };
  const eff = effectiveness(b.type, move);
  let damage = 0, effect, coach;
  if (eff === 'transfer') {
    effect = 'TRANSFER'; coach = COACH.transfer;
    b.type = b.rng.pick(['visionary', 'technical', 'operator']);
    b.title = b.rng.pick(TITLES[b.type]);
    b.name = personName(b.rng);
  } else if (eff === 0) {
    effect = 'NONE'; coach = COACH.noTransfer;
  } else {
    damage = Math.round(b.power * (eff > 1 ? STRONG_MULT : eff));
    effect = eff > 1 ? 'STRONG' : eff < 1 ? 'WEAK' : 'OK';
    coach = COACH[b.type][effect] || COACH[b.type].WEAK;
    b.resist = Math.max(0, b.resist - damage);
  }
  b.turns++;
  b.revealed = true;
  if (!b.rival) b.patience--;
  else b.rivalProgress = Math.min(b.rivalMax, b.rivalProgress + RIVAL_STEP);

  if (b.resist <= 0) b.outcome = 'won';
  else if (b.rival && b.rivalProgress >= b.rivalMax) b.outcome = 'rival';
  else if (!b.rival && b.patience <= 0) b.outcome = 'lost';
  return { damage, effect, coach, outcome: b.outcome, revealed: b.revealed };
}
