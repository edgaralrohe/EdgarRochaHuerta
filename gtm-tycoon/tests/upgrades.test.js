import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UPGRADES, offerUpgrades, buyUpgrade, hasPower } from '../src/core/upgrades.js';
import { newGame } from '../src/core/game.js';
import { createRng } from '../src/core/rng.js';

test('catalog includes the five platform powers', () => {
  const ids = UPGRADES.map(u => u.id);
  for (const id of ['enrich', 'intent', 'sequence', 'crm', 'icp']) assert.ok(ids.includes(id));
  for (const u of UPGRADES) { assert.ok(['rare', 'common'].includes(u.rarity)); assert.ok(u.cost > 0); assert.ok(u.desc.length > 0); }
});

test('offer is 3 distinct upgrades not already owned', () => {
  for (let s = 0; s < 20; s++) {
    const offer = offerUpgrades(createRng(s), ['enrich', 'crm']);
    assert.equal(offer.length, 3);
    assert.equal(new Set(offer).size, 3);
    assert.ok(!offer.includes('enrich') && !offer.includes('crm'));
  }
});

test('offer shrinks when few remain', () => {
  const owned = UPGRADES.map(u => u.id).slice(0, UPGRADES.length - 1);
  assert.equal(offerUpgrades(createRng(1), owned).length, 1);
});

test('buying deducts cash and grants the power', () => {
  const s = newGame(1); s.cash = 5000;
  assert.deepEqual(buyUpgrade(s, 'enrich'), { ok: true, reason: null });
  assert.equal(s.cash, 1000);
  assert.equal(hasPower(s, 'enrich'), true);
});

test('cannot buy without cash, twice, or unknown', () => {
  const s = newGame(1); s.cash = 500;
  assert.equal(buyUpgrade(s, 'enrich').reason, 'cash');
  s.cash = 9000; buyUpgrade(s, 'crm');
  assert.equal(buyUpgrade(s, 'crm').reason, 'owned');
  assert.equal(buyUpgrade(s, 'nope').reason, 'unknown');
});

test('coffee raises max energy', () => {
  const s = newGame(1); s.cash = 1000;
  buyUpgrade(s, 'coffee');
  assert.equal(s.maxEnergy, 120);
});
