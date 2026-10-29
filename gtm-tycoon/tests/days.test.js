import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayConfig } from '../src/core/days.js';
import { DAYS } from '../src/core/config.js';

test('five days in a week', () => assert.equal(DAYS, 5));

test('day 1 rules are industry and size', () => {
  const d = dayConfig(1);
  assert.deepEqual(d.rules, ['industry', 'size']);
  assert.equal(d.mystery, false);
  assert.equal(d.badData, false);
  assert.equal(d.gatekeepers, false);
});

test('mystery boxes from day 2', () => {
  assert.equal(dayConfig(2).mystery, true);
  assert.equal(dayConfig(5).mystery, true);
});

test('gatekeepers and bad data appear on day 3, rule on day 4', () => {
  assert.equal(dayConfig(3).gatekeepers, true);
  assert.equal(dayConfig(3).badData, true);
  assert.ok(!dayConfig(3).rules.includes('data'));
  assert.ok(dayConfig(4).rules.includes('data'));
  assert.ok(dayConfig(5).rules.includes('data'));
});

test('day 5 is faster', () => {
  assert.ok(dayConfig(5).speed > dayConfig(4).speed);
});

test('memo for tomorrow on days 1-4, none on day 5', () => {
  for (let d = 1; d <= 4; d++) {
    const m = dayConfig(d).memo;
    assert.ok(m && m.title && m.body && m.rule, `day ${d} memo`);
  }
  assert.equal(dayConfig(5).memo, null);
});

test('every day has a one-sentence morning line without hype', () => {
  for (let d = 1; d <= 5; d++) {
    const line = dayConfig(d).morningLine;
    assert.ok(line.length > 0 && line.length < 90, `day ${d}`);
    assert.ok(!line.includes('!'), 'no exclamation hype');
  }
});

test('out-of-range days clamp', () => {
  assert.equal(dayConfig(0).day, 1);
  assert.equal(dayConfig(9).day, 5);
});
