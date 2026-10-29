import { DAY_START, MAX_ENERGY, CALL_ENERGY, BAD_CATCH_ENERGY, COMBO_SIZE, COMBO_ENERGY, CALL_MINUTES, GYM_MINUTES,
  MAX_PITCH_LEVEL, RIVAL_DEAL, QUOTA, DAYS } from './config.js';
import { advanceClock, isDayOver } from './clock.js';
import { hasPower } from './upgrades.js';
import { isBadFit } from './leads.js';

export const SAVE_VERSION = 1;

const freshStats = () => ({ deals: 0, revenue: 0, goodCaught: 0, badCaught: 0, calls: 0, deadEnds: 0, misses: { fit: 0, data: 0, pitch: 0 } });
const freshToday = () => ({ arcadeDone: false, gymDone: false, rivalDone: false, combo: 0, offer: null, stats: freshStats() });

export function newGame(seed) {
  return {
    version: SAVE_VERSION, seed: seed >>> 0, day: 1, minutes: DAY_START,
    energy: MAX_ENERGY, maxEnergy: MAX_ENERGY, cash: 0, revenue: 0, pitchLevel: 0,
    powers: [], pipeline: [], week: [], today: freshToday(),
  };
}

export function startDay(state) {
  state.minutes = DAY_START;
  state.energy = state.maxEnergy;
  state.today = freshToday();
  return state;
}

const addEnergy = (state, delta) => { state.energy = Math.max(0, Math.min(state.maxEnergy, state.energy + delta)); };

export function recordCatch(state, lead, judgement) {
  const t = state.today;
  if (judgement.ok) {
    state.pipeline.push(lead);
    t.stats.goodCaught++;
    t.combo++;
    const combo = t.combo % COMBO_SIZE === 0;
    const before = state.energy;
    if (combo) addEnergy(state, COMBO_ENERGY);
    return { energyDelta: state.energy - before, combo };
  }
  t.combo = 0;
  t.stats.badCaught++;
  t.stats.misses[judgement.reason]++;
  const free = hasPower(state, 'icp') && isBadFit(lead);
  const before = state.energy;
  if (!free) addEnergy(state, -BAD_CATCH_ENERGY);
  return { energyDelta: state.energy - before, combo: false };
}

export function canCall(state) {
  if (isDayOver(state)) return { ok: false, reason: 'time' };
  if (state.energy < CALL_ENERGY) return { ok: false, reason: 'energy' };
  return { ok: true, reason: null };
}

const spendCall = state => { addEnergy(state, -CALL_ENERGY); advanceClock(state, CALL_MINUTES); state.today.stats.calls++; };
const removeLead = (state, id) => { state.pipeline = state.pipeline.filter(l => l.id !== id); };

export function beginCall(state, leadId) {
  const lead = state.pipeline.find(l => l.id === leadId);
  if (!lead) return { ok: false, reason: 'missing', deadEnd: null };
  const can = canCall(state);
  if (!can.ok) return { ...can, deadEnd: null };
  spendCall(state);
  const deadEnd = lead.bounced ? 'BOUNCED' : lead.dupeOf ? 'DUPLICATE' : null;
  if (deadEnd) {
    removeLead(state, leadId);
    state.today.stats.misses.data++;
    state.today.stats.deadEnds++;
  }
  return { ok: true, reason: null, deadEnd };
}

const bank = (state, value) => {
  state.cash += value; state.revenue += value;
  state.today.stats.deals++; state.today.stats.revenue += value;
};

export function resolveCall(state, leadId, outcome) {
  const lead = state.pipeline.find(l => l.id === leadId);
  if (!lead) return outcome;
  if (outcome === 'won') {
    bank(state, lead.value);
    removeLead(state, leadId);
    return 'won';
  }
  if (hasPower(state, 'sequence') && !lead.followup) {
    lead.followup = true;
    return 'followup';
  }
  removeLead(state, leadId);
  state.today.stats.misses.pitch++;
  state.today.stats.deadEnds++;
  return 'lost';
}

export function beginRival(state) {
  if (state.day < 2 || state.today.rivalDone) return { ok: false, reason: 'done' };
  const can = canCall(state);
  if (!can.ok) return can;
  spendCall(state);
  state.today.rivalDone = true;
  return { ok: true, reason: null };
}

export function resolveRival(state, outcome) {
  state.today.rivalDone = true;
  if (outcome === 'won') bank(state, RIVAL_DEAL);
  else { state.today.stats.misses.pitch++; state.today.stats.deadEnds++; }
}

export function gymDrill(state) {
  if (state.today.gymDone) return { ok: false, reason: 'done' };
  if (state.pitchLevel >= MAX_PITCH_LEVEL) return { ok: false, reason: 'max' };
  if (isDayOver(state)) return { ok: false, reason: 'time' };
  state.today.gymDone = true;
  state.pitchLevel++;
  advanceClock(state, GYM_MINUTES);
  return { ok: true, reason: null };
}

export function endDay(state) {
  const stats = state.today.stats;
  const lostLeads = hasPower(state, 'crm') ? 0 : state.pipeline.length;
  if (lostLeads) state.pipeline = [];
  const summary = summarizeDay(stats);
  state.week.push({ day: state.day, summary, ...stats, lostLeads });
  return { summary, stats, lostLeads };
}

export function nextDay(state) {
  state.day = Math.min(DAYS, state.day + 1);
  for (const l of state.pipeline) l.followup = false;
  return startDay(state);
}

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
export const numberWord = n => (n >= 0 && n <= 20 ? WORDS[n] : String(n));
const plural = (n, word) => `${numberWord(n)} ${word}${n === 1 ? '' : 's'}`;
const cap = s => s[0].toUpperCase() + s.slice(1);

const MISS_NAMES = { data: 'bad data', fit: 'wrong fit', pitch: 'wrong pitch' };

export function summarizeDay(stats) {
  const head = cap(`${plural(stats.deals, 'deal')}, ${plural(stats.deadEnds, 'dead end')}.`);
  const top = ['data', 'fit', 'pitch'].reduce((best, k) => (stats.misses[k] > (best ? stats.misses[best] : 0) ? k : best), null);
  return top ? `${head} Your most common miss: ${MISS_NAMES[top]}.` : `${head} A clean day.`;
}

export function finalReport(state) {
  const r = state.revenue / QUOTA;
  const grade = r >= 1.5 ? 'S' : r >= 1 ? 'A' : r >= 0.7 ? 'B' : 'C';
  return { revenue: state.revenue, quota: QUOTA, hit: r >= 1, grade };
}
