import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createArcade, stepArcade, ARCADE_W } from '../src/core/arcade.js';
import { createRng } from '../src/core/rng.js';

const lead = (id, extra = {}) => ({ id, company: 'Co ' + id, industry: 'store', size: 'mid', bounced: false, dupeOf: null, mystery: false, intent: false, value: 3000,
  buyer: { name: 'A B', title: 'CFO', type: 'visionary' }, ...extra });
const mk = (leads, opts = {}) => createArcade({ leads, rules: ['industry', 'size'], powers: opts.powers || [], speed: 1, duration: opts.duration || 10, rng: createRng(3) });

function run(a, follow, seconds = 12) {
  const events = [];
  for (let t = 0; t < seconds * 60 && !a.done; t++) {
    const item = a.items[0];
    const x = item ? (follow ? item.x : (item.x < ARCADE_W / 2 ? ARCADE_W - 5 : 5)) : a.catcher.x;
    events.push(...stepArcade(a, 1 / 60, { x }));
  }
  return events;
}

test('arcade starts with no items and a centered catcher', () => {
  const a = mk([lead('a')]);
  assert.equal(a.items.length, 0); assert.equal(a.catcher.x, ARCADE_W / 2); assert.equal(a.done, false);
});

test('following a lead catches it and judges it', () => {
  const a = mk([lead('a')]);
  const catches = run(a, true).filter(e => e.type === 'catch');
  assert.equal(catches.length, 1);
  assert.equal(catches[0].lead.id, 'a');
  assert.equal(catches[0].judgement.label, 'GOOD LEAD');
});

test('bad leads are judged against the rules', () => {
  const a = mk([lead('a', { industry: 'factory' })]);
  const c = run(a, true).find(e => e.type === 'catch');
  assert.equal(c.judgement.label, 'NOT ICP');
});

test('avoiding a lead emits a miss, not a catch', () => {
  const a = mk([lead('a')]);
  const ev = run(a, false);
  assert.equal(ev.filter(e => e.type === 'catch').length, 0);
  assert.equal(ev.filter(e => e.type === 'miss').length, 1);
});

test('all leads spawn before the round ends', () => {
  const leads = Array.from({ length: 8 }, (_, i) => lead('l' + i));
  const a = mk(leads);
  const ev = run(a, true);
  assert.equal(ev.filter(e => e.type === 'catch' || e.type === 'miss').length, 8);
});

test('mystery box reveals partway down', () => {
  const a = mk([lead('a', { mystery: true })]);
  let revealedAt = null;
  for (let t = 0; t < 600 && revealedAt === null; t++) {
    const ev = stepArcade(a, 1 / 60, { x: 160 });
    if (ev.some(e => e.type === 'reveal')) revealedAt = a.items[0].y;
  }
  assert.ok(revealedAt !== null && revealedAt > 0, 'revealed mid-fall');
});

test('enrich reveals mystery boxes on spawn', () => {
  const a = mk([lead('a', { mystery: true })], { powers: ['enrich'] });
  for (let t = 0; t < 120 && a.items.length === 0; t++) stepArcade(a, 1 / 60, { x: 160 });
  assert.equal(a.items[0].revealed, true);
});

test('icp filter fades bad-fit items, intent glows', () => {
  const a = mk([lead('a', { industry: 'bank' }), lead('b', { intent: true })], { powers: ['icp', 'intent'] });
  while (a.items.length < 2 && !a.done) stepArcade(a, 1 / 60, { x: 160 });
  const [bank, hot] = a.items;
  assert.equal(bank.faded, true); assert.equal(hot.glow, true);
});

test('round ends after its duration with an end event', () => {
  const a = mk([lead('a')], { duration: 5 });
  const ev = run(a, true, 10);
  assert.equal(a.done, true);
  assert.equal(ev.filter(e => e.type === 'end').length, 1);
});

test('catcher moves no faster than its speed and stays on screen', () => {
  const a = mk([lead('a')]);
  stepArcade(a, 0.1, { x: 9999 });
  assert.ok(a.catcher.x < ARCADE_W);
  assert.ok(a.catcher.x - ARCADE_W / 2 <= 40);
});
