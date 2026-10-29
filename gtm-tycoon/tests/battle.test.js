import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBattle, applyMove, effectiveness, MOVES } from '../src/core/battle.js';
import { createRng } from '../src/core/rng.js';

const lead = (type, extra = {}) => ({ id: 'l1', company: 'Acme Goods', value: 4000, intent: false, mystery: false,
  buyer: { name: 'Lucia Rios', title: 'CFO', type, skin: 1, hair: 'long', shirt: 'ink' }, ...extra });
const mk = (type, opts = {}) => createBattle({ lead: lead(type, opts.lead), powers: opts.powers || ['enrich'], pitchLevel: opts.pitchLevel || 0, rival: opts.rival || false, rng: createRng(1) });

test('four moves', () => assert.deepEqual(MOVES, ['IMPACT', 'DEMO', 'WORKFLOW', 'FIND MANAGER']));

test('effectiveness table', () => {
  assert.equal(effectiveness('visionary', 'IMPACT'), 2);
  assert.equal(effectiveness('visionary', 'DEMO'), 0.5);
  assert.equal(effectiveness('visionary', 'WORKFLOW'), 1);
  assert.equal(effectiveness('technical', 'DEMO'), 2);
  assert.equal(effectiveness('technical', 'IMPACT'), 0.5);
  assert.equal(effectiveness('operator', 'WORKFLOW'), 2);
  assert.equal(effectiveness('operator', 'DEMO'), 1);
  assert.equal(effectiveness('operator', 'IMPACT'), 0.5);
  for (const m of ['IMPACT', 'DEMO', 'WORKFLOW']) assert.equal(effectiveness('gatekeeper', m), 0.5);
  assert.equal(effectiveness('gatekeeper', 'FIND MANAGER'), 'transfer');
  assert.equal(effectiveness('visionary', 'FIND MANAGER'), 0);
});

test('new battle starts at full resist and patience', () => {
  const b = mk('visionary');
  assert.equal(b.resist, 48); assert.equal(b.maxResist, 48);
  assert.equal(b.patience, 4); assert.equal(b.outcome, null);
});

test('strong move wins in two turns', () => {
  const b = mk('visionary');
  const r1 = applyMove(b, 'IMPACT');
  assert.equal(r1.effect, 'STRONG'); assert.equal(r1.damage, 24); assert.equal(r1.outcome, null);
  const r2 = applyMove(b, 'IMPACT');
  assert.equal(r2.outcome, 'won'); assert.equal(b.resist, 0);
});

test('running out of patience loses', () => {
  const b = mk('visionary');
  let r;
  for (let i = 0; i < 4; i++) r = applyMove(b, 'DEMO');
  assert.equal(r.outcome, 'lost'); assert.equal(b.patience, 0);
});

test('coach line is a single sentence', () => {
  const b = mk('visionary');
  const r = applyMove(b, 'DEMO');
  assert.ok(r.coach.length > 0);
  assert.ok(!r.coach.includes('!'));
});

test('find manager on a gatekeeper transfers to a decision maker', () => {
  const b = mk('gatekeeper');
  const r = applyMove(b, 'FIND MANAGER');
  assert.equal(r.effect, 'TRANSFER');
  assert.notEqual(b.type, 'gatekeeper');
  assert.ok(['visionary', 'technical', 'operator'].includes(b.type));
  assert.equal(b.patience, 3);
  assert.equal(b.resist, 48);
});

test('find manager on a real buyer does nothing', () => {
  const b = mk('operator');
  const r = applyMove(b, 'FIND MANAGER');
  assert.equal(r.damage, 0); assert.equal(r.effect, 'NONE'); assert.equal(b.type, 'operator');
});

test('intent lowers resist to 36', () => {
  const b = mk('operator', { lead: { intent: true } });
  assert.equal(b.resist, 36); assert.equal(b.maxResist, 36);
});

test('type is hidden without enrich and revealed after first move', () => {
  const b = mk('technical', { powers: [] });
  assert.equal(b.revealed, false);
  const r = applyMove(b, 'IMPACT');
  assert.equal(r.revealed, true); assert.equal(b.revealed, true);
});

test('enrich reveals type from the start', () => {
  assert.equal(mk('technical', { powers: ['enrich'] }).revealed, true);
});

test('call script adds one patience', () => {
  assert.equal(mk('operator', { powers: ['script'] }).patience, 5);
});

test('pitch level adds damage', () => {
  const b = mk('visionary', { pitchLevel: 2 });
  assert.equal(applyMove(b, 'WORKFLOW').damage, 12);
});

test('rival wins when its bar fills first', () => {
  const b = mk('visionary', { rival: true });
  assert.equal(b.rivalProgress, 0);
  let r;
  for (let i = 0; i < 4; i++) { r = applyMove(b, 'DEMO'); if (r.outcome) break; }
  assert.equal(r.outcome, 'rival');
});

test('closing before the rival wins the pitch-off', () => {
  const b = mk('visionary', { rival: true });
  applyMove(b, 'IMPACT');
  assert.equal(applyMove(b, 'IMPACT').outcome, 'won');
});

test('moves after the battle ends are ignored', () => {
  const b = mk('visionary');
  applyMove(b, 'IMPACT'); applyMove(b, 'IMPACT');
  const r = applyMove(b, 'IMPACT');
  assert.equal(r.damage, 0); assert.equal(r.outcome, 'won');
});
