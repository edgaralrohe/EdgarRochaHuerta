import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateLeads, judgeLead, isBadFit, BUYER_TYPES } from '../src/core/leads.js';
import { createRng } from '../src/core/rng.js';

const base = { industry: 'store', size: 'mid', bounced: false, dupeOf: null };
const ALL = ['industry', 'size', 'data'];

test('good lead passes every rule', () => {
  assert.deepEqual(judgeLead(base, ALL), { ok: true, label: 'GOOD LEAD', reason: null });
});

test('wrong industry is NOT ICP', () => {
  for (const industry of ['bank', 'factory', 'hospital']) {
    const j = judgeLead({ ...base, industry }, ALL);
    assert.equal(j.ok, false); assert.equal(j.label, 'NOT ICP'); assert.equal(j.reason, 'fit');
  }
});

test('size rule flags tiny and giant', () => {
  assert.equal(judgeLead({ ...base, size: 'tiny' }, ALL).label, 'TOO SMALL');
  assert.equal(judgeLead({ ...base, size: 'giant' }, ALL).label, 'TOO BIG');
});

test('data rule flags bounced and duplicates', () => {
  const b = judgeLead({ ...base, bounced: true }, ALL);
  assert.equal(b.label, 'BOUNCED'); assert.equal(b.reason, 'data');
  assert.equal(judgeLead({ ...base, dupeOf: 'x' }, ALL).label, 'DUPLICATE');
});

test('inactive rules do not punish', () => {
  assert.equal(judgeLead({ ...base, bounced: true }, ['industry', 'size']).ok, true);
  assert.equal(judgeLead({ ...base, size: 'tiny' }, ['industry']).ok, true);
});

test('pop-up labels stay within 3 words', () => {
  const leads = [base, { ...base, industry: 'bank' }, { ...base, size: 'tiny' }, { ...base, size: 'giant' }, { ...base, bounced: true }, { ...base, dupeOf: 'a' }];
  for (const l of leads) assert.ok(judgeLead(l, ALL).label.split(' ').length <= 3);
});

test('isBadFit covers industry and size, not data', () => {
  assert.equal(isBadFit(base), false);
  assert.equal(isBadFit({ ...base, industry: 'bank' }), true);
  assert.equal(isBadFit({ ...base, size: 'giant' }), true);
  assert.equal(isBadFit({ ...base, bounced: true }), false);
});

test('generateLeads is deterministic', () => {
  const a = generateLeads(createRng(11), 3);
  const b = generateLeads(createRng(11), 3);
  assert.deepEqual(a, b);
});

test('lead ids are unique and companies fictional strings', () => {
  const leads = generateLeads(createRng(4), 5, 40);
  assert.equal(new Set(leads.map(l => l.id)).size, leads.length);
  for (const l of leads) { assert.equal(typeof l.company, 'string'); assert.ok(l.company.length > 2); }
});

test('day 1 has no mystery, no bad data, no gatekeepers', () => {
  for (let s = 0; s < 10; s++) {
    for (const l of generateLeads(createRng(s), 1, 30)) {
      assert.equal(l.mystery, false); assert.equal(l.bounced, false); assert.equal(l.dupeOf, null);
      assert.notEqual(l.buyer.type, 'gatekeeper');
    }
  }
});

test('day 4 produces bounced and duplicate leads; duplicates point back', () => {
  let bounced = 0, dupes = 0;
  for (let s = 0; s < 5; s++) {
    const leads = generateLeads(createRng(s), 4, 30);
    bounced += leads.filter(l => l.bounced).length;
    for (const d of leads.filter(l => l.dupeOf)) {
      dupes++;
      const orig = leads.find(l => l.id === d.dupeOf);
      assert.ok(orig, 'original exists'); assert.equal(orig.company, d.company);
    }
  }
  assert.ok(bounced > 0); assert.ok(dupes > 0);
});

test('mystery boxes appear from day 2', () => {
  const leads = generateLeads(createRng(8), 2, 60);
  assert.ok(leads.some(l => l.mystery));
});

test('every buyer has a valid type and a mix of good and bad leads exists', () => {
  const leads = generateLeads(createRng(21), 3, 40);
  for (const l of leads) assert.ok(BUYER_TYPES.includes(l.buyer.type));
  assert.ok(leads.some(l => !isBadFit(l)));
  assert.ok(leads.some(l => isBadFit(l)));
});

test('gatekeepers appear from day 3', () => {
  const leads = generateLeads(createRng(2), 3, 80);
  assert.ok(leads.some(l => l.buyer.type === 'gatekeeper'));
});

test('good leads carry a positive deal value', () => {
  for (const l of generateLeads(createRng(1), 1, 30)) assert.ok(l.value >= 1000);
});
