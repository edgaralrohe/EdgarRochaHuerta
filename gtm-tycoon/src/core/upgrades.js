// The platform's features show up as power-ups. Generic icons until BRAND_MODE is approved.
export const UPGRADES = [
  { id: 'enrich', name: 'ENRICH', rarity: 'rare', cost: 4000, desc: 'See every buyer type and blank lead.' },
  { id: 'intent', name: 'INTENT', rarity: 'rare', cost: 4000, desc: 'Leads ready to buy glow and go first.' },
  { id: 'script', name: 'CALL SCRIPT', rarity: 'rare', cost: 3000, desc: 'One more turn of patience per call.' },
  { id: 'sequence', name: 'SEQUENCE', rarity: 'common', cost: 2000, desc: 'A lost call comes back once.' },
  { id: 'crm', name: 'CRM SYNC', rarity: 'common', cost: 2000, desc: 'Uncalled leads carry to tomorrow.' },
  { id: 'icp', name: 'ICP FILTER', rarity: 'common', cost: 2000, desc: 'Bad-fit leads fade out and cost nothing.' },
  { id: 'coffee', name: 'COFFEE', rarity: 'common', cost: 1000, desc: 'Plus 20 max energy, every day.' },
];

export const upgradeById = id => UPGRADES.find(u => u.id === id) || null;
export const hasPower = (state, id) => state.powers.includes(id);

export function offerUpgrades(rng, owned) {
  const pool = UPGRADES.filter(u => !owned.includes(u.id)).map(u => u.id);
  const offer = [];
  while (offer.length < 3 && pool.length) offer.push(pool.splice(Math.floor(rng.next() * pool.length), 1)[0]);
  return offer;
}

export function buyUpgrade(state, id) {
  const u = upgradeById(id);
  if (!u) return { ok: false, reason: 'unknown' };
  if (hasPower(state, id)) return { ok: false, reason: 'owned' };
  if (state.cash < u.cost) return { ok: false, reason: 'cash' };
  state.cash -= u.cost;
  state.powers.push(id);
  if (id === 'coffee') state.maxEnergy += 20;
  return { ok: true, reason: null };
}
