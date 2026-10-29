import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatClock, advanceClock, isDayOver } from '../src/core/clock.js';
import { DAY_START, DAY_END } from '../src/core/config.js';

test('formatClock uses 12h with AM/PM', () => {
  assert.equal(formatClock(540), '09:00 AM');
  assert.equal(formatClock(580), '09:40 AM');
  assert.equal(formatClock(720), '12:00 PM');
  assert.equal(formatClock(780), '01:00 PM');
  assert.equal(formatClock(1080), '06:00 PM');
});

test('day runs from 9 AM to 6 PM', () => {
  assert.equal(DAY_START, 540);
  assert.equal(DAY_END, 1080);
});

test('advanceClock moves time and caps at day end', () => {
  const s = { minutes: 540 };
  assert.equal(advanceClock(s, 90), 630);
  advanceClock(s, 1000);
  assert.equal(s.minutes, DAY_END);
});

test('isDayOver at 6 PM', () => {
  assert.equal(isDayOver({ minutes: 1079 }), false);
  assert.equal(isDayOver({ minutes: 1080 }), true);
});
