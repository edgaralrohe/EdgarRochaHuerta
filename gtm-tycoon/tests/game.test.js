import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, startDay, recordCatch, canCall, beginCall, resolveCall, beginRival, resolveRival,
  gymDrill, endDay, nextDay, summarizeDay, finalReport, numberWord } from '../src/core/game.js';
import { QUOTA } from '../src/core/config.js';

const good = (id = 'a', extra = {}) => ({ id, company: 'Northwind Shop', industry: 'store', size: 'mid', bounced: false, dupeOf: null, mystery: false, intent: false, value: 4000,
  buyer: { name: 'Lucia Rios', title: 'CFO', type: 'visionary' }, ...extra });
const OK = { ok: true, label: 'GOOD LEAD', reason: null };
const BAD = { ok: false, label: 'NOT ICP', reason: 'fit' };

test('new game starts on day 1 at 9 AM with full energy', () => {
  const s = newGame(123);
  assert.equal(s.day, 1); assert.equal(s.minutes, 540);
  assert.equal(s.energy, 100); assert.equal(s.maxEnergy, 100);
  assert.equal(s.cash, 0); assert.equal(s.revenue, 0);
  assert.deepEqual(s.pipeline, []); assert.deepEqual(s.powers, []);
  assert.equal(s.today.arcadeDone, false);
});

test('good catch goes to the pipeline', () => {
  const s = newGame(1);
  const r = recordCatch(s, good(), OK);
  assert.equal(s.pipeline.length, 1); assert.equal(r.energyDelta, 0);
  assert.equal(s.today.stats.goodCaught, 1);
});

test('bad catch costs 10 energy and resets combo', () => {
  const s = newGame(1);
  recordCatch(s, good('a'), OK); recordCatch(s, good('b'), OK);
  const r = recordCatch(s, good('c', { industry: 'bank' }), BAD);
  assert.equal(r.energyDelta, -10); assert.equal(s.energy, 90);
  assert.equal(s.today.combo, 0); assert.equal(s.today.stats.misses.fit, 1);
});

test('icp filter makes bad-fit catches free', () => {
  const s = newGame(1); s.powers.push('icp');
  assert.equal(recordCatch(s, good('c', { industry: 'bank' }), BAD).energyDelta, 0);
  assert.equal(s.energy, 100);
});

test('every third good catch in a row is a combo worth +5 energy', () => {
  const s = newGame(1); s.energy = 50;
  recordCatch(s, good('a'), OK); recordCatch(s, good('b'), OK);
  const r = recordCatch(s, good('c'), OK);
  assert.equal(r.combo, true); assert.equal(r.energyDelta, 5); assert.equal(s.energy, 55);
});

test('energy never goes below 0 or above max', () => {
  const s = newGame(1); s.energy = 5;
  recordCatch(s, good('x', { industry: 'bank' }), BAD);
  assert.equal(s.energy, 0);
  s.energy = 100;
  for (const id of 'abc') recordCatch(s, good(id), OK);
  assert.equal(s.energy, 100);
});

test('calls cost energy and time', () => {
  const s = newGame(1); s.pipeline.push(good());
  const r = beginCall(s, 'a');
  assert.equal(r.ok, true); assert.equal(r.deadEnd, null);
  assert.equal(s.energy, 90); assert.equal(s.minutes, 570);
});

test('no call without energy', () => {
  const s = newGame(1); s.pipeline.push(good()); s.energy = 5;
  assert.equal(canCall(s).ok, false);
  assert.equal(beginCall(s, 'a').reason, 'energy');
});

test('no call after 6 PM', () => {
  const s = newGame(1); s.pipeline.push(good()); s.minutes = 1080;
  assert.equal(beginCall(s, 'a').reason, 'time');
});

test('bounced and duplicate leads are dead ends', () => {
  const s = newGame(1); s.pipeline.push(good('a', { bounced: true }), good('b', { dupeOf: 'z' }));
  assert.equal(beginCall(s, 'a').deadEnd, 'BOUNCED');
  assert.equal(beginCall(s, 'b').deadEnd, 'DUPLICATE');
  assert.equal(s.pipeline.length, 0);
  assert.equal(s.today.stats.misses.data, 2);
  assert.equal(s.today.stats.deadEnds, 2);
});

test('won call adds cash and revenue', () => {
  const s = newGame(1); s.pipeline.push(good());
  beginCall(s, 'a');
  assert.equal(resolveCall(s, 'a', 'won'), 'won');
  assert.equal(s.cash, 4000); assert.equal(s.revenue, 4000);
  assert.equal(s.today.stats.deals, 1); assert.equal(s.pipeline.length, 0);
});

test('lost call is a dead end; sequence gives one follow-up', () => {
  const s = newGame(1); s.pipeline.push(good());
  assert.equal(resolveCall(s, 'a', 'lost'), 'lost');
  assert.equal(s.today.stats.misses.pitch, 1); assert.equal(s.pipeline.length, 0);

  const t = newGame(1); t.powers.push('sequence'); t.pipeline.push(good());
  assert.equal(resolveCall(t, 'a', 'lost'), 'followup');
  assert.equal(t.pipeline.length, 1); assert.equal(t.pipeline[0].followup, true);
  assert.equal(resolveCall(t, 'a', 'lost'), 'lost');
  assert.equal(t.pipeline.length, 0);
});

test('rival pitch-off once per day', () => {
  const s = newGame(1); s.day = 2;
  assert.equal(beginRival(s).ok, true);
  resolveRival(s, 'won');
  assert.equal(s.revenue, 3000); assert.equal(s.today.rivalDone, true);
  assert.equal(beginRival(s).ok, false);
});

test('gym drill raises pitch level once per day up to 3', () => {
  const s = newGame(1);
  assert.equal(gymDrill(s).ok, true); assert.equal(s.pitchLevel, 1); assert.equal(s.minutes, 600);
  assert.equal(gymDrill(s).ok, false);
  s.pitchLevel = 3; s.today.gymDone = false;
  assert.equal(gymDrill(s).reason, 'max');
});

test('end of day loses uncalled leads without CRM sync', () => {
  const s = newGame(1); s.pipeline.push(good('a'), good('b'));
  const r = endDay(s);
  assert.equal(r.lostLeads, 2); assert.deepEqual(s.pipeline, []);
  assert.equal(s.week.length, 1);
});

test('CRM sync carries leads into tomorrow', () => {
  const s = newGame(1); s.powers.push('crm'); s.pipeline.push(good('a'));
  assert.equal(endDay(s).lostLeads, 0);
  nextDay(s);
  assert.equal(s.day, 2); assert.equal(s.pipeline.length, 1);
});

test('next day resets clock, energy and daily flags', () => {
  const s = newGame(1); s.minutes = 1000; s.energy = 10; s.today.arcadeDone = true;
  endDay(s); nextDay(s);
  assert.equal(s.minutes, 540); assert.equal(s.energy, 100); assert.equal(s.today.arcadeDone, false);
  startDay(s); assert.equal(s.day, 2);
});

test('numberWord spells small numbers', () => {
  assert.equal(numberWord(0), 'zero'); assert.equal(numberWord(6), 'six'); assert.equal(numberWord(12), 'twelve'); assert.equal(numberWord(42), '42');
});

test('summarizeDay reads like the art bible', () => {
  const stats = { deals: 6, deadEnds: 2, goodCaught: 8, badCaught: 1, calls: 8, revenue: 20000, misses: { fit: 1, data: 2, pitch: 0 } };
  assert.equal(summarizeDay(stats), 'Six deals, two dead ends. Your most common miss: bad data.');
  assert.equal(summarizeDay({ ...stats, deals: 1, deadEnds: 1, misses: { fit: 3, data: 0, pitch: 1 } }), 'One deal, one dead end. Your most common miss: wrong fit.');
  assert.equal(summarizeDay({ ...stats, deals: 0, deadEnds: 0, misses: { fit: 0, data: 0, pitch: 0 } }), 'Zero deals, zero dead ends. A clean day.');
});

test('final report grades against quota', () => {
  const s = newGame(1);
  s.revenue = QUOTA; assert.deepEqual(finalReport(s), { revenue: QUOTA, quota: QUOTA, hit: true, grade: 'A' });
  s.revenue = QUOTA * 1.5; assert.equal(finalReport(s).grade, 'S');
  s.revenue = QUOTA * 0.75; assert.equal(finalReport(s).grade, 'B'); assert.equal(finalReport(s).hit, false);
  s.revenue = 0; assert.equal(finalReport(s).grade, 'C');
});
