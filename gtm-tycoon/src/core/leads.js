import { dayConfig } from './days.js';
import { personName, companyName, TITLES } from './names.js';

export const BUYER_TYPES = ['visionary', 'technical', 'operator', 'gatekeeper'];
const DECISION_MAKERS = ['visionary', 'technical', 'operator'];
const SHIRTS = ['ink', 'graphite', 'pebble', 'marble'];
const HAIRS = ['short', 'long', 'bun'];

const EMPLOYEES = { tiny: [3, 30], mid: [50, 500], giant: [2000, 20000] };

// Rules are checked in a fixed order so the pop-up names the first problem.
export function judgeLead(lead, rules) {
  if (rules.includes('industry') && lead.industry !== 'store') return { ok: false, label: 'NOT ICP', reason: 'fit' };
  if (rules.includes('size') && lead.size === 'tiny') return { ok: false, label: 'TOO SMALL', reason: 'fit' };
  if (rules.includes('size') && lead.size === 'giant') return { ok: false, label: 'TOO BIG', reason: 'fit' };
  if (rules.includes('data') && lead.bounced) return { ok: false, label: 'BOUNCED', reason: 'data' };
  if (rules.includes('data') && lead.dupeOf) return { ok: false, label: 'DUPLICATE', reason: 'data' };
  return { ok: true, label: 'GOOD LEAD', reason: null };
}

export const isBadFit = lead => lead.industry !== 'store' || lead.size !== 'mid';

function makeBuyer(rng, cfg) {
  const type = cfg.gatekeepers && rng.chance(0.25) ? 'gatekeeper' : rng.pick(DECISION_MAKERS);
  return { name: personName(rng), title: rng.pick(TITLES[type]), type, skin: rng.int(0, 2), hair: rng.pick(HAIRS), shirt: rng.pick(SHIRTS) };
}

export function generateLeads(rng, day, count) {
  const cfg = dayConfig(day);
  const n = count ?? cfg.leadCount;
  const leads = [];
  for (let i = 0; i < n; i++) {
    const id = `d${cfg.day}-${i}`;
    const canDupe = cfg.badData && leads.length > 2;
    if (canDupe && rng.chance(0.1)) {
      const orig = rng.pick(leads.filter(l => !l.dupeOf));
      leads.push({ ...orig, id, dupeOf: orig.id, mystery: false, buyer: { ...orig.buyer } });
      continue;
    }
    // About half the inbox is a good fit; the rest is wrong industry or wrong size.
    const roll = rng.next();
    const industry = roll < 0.55 ? 'store' : rng.pick(['bank', 'factory', 'hospital']);
    const size = industry === 'store' && roll < 0.42 ? 'mid' : rng.pick(['tiny', 'mid', 'mid', 'giant']);
    const [lo, hi] = EMPLOYEES[size];
    leads.push({
      id,
      company: companyName(rng, industry),
      industry,
      size,
      employees: rng.int(lo, hi),
      bounced: cfg.badData && rng.chance(0.12),
      dupeOf: null,
      mystery: cfg.mystery && rng.chance(0.2),
      intent: rng.chance(0.3),
      value: rng.int(10, 25) * 100,
      buyer: makeBuyer(rng, cfg),
    });
  }
  return leads;
}
