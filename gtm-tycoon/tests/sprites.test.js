import { test } from 'node:test';
import assert from 'node:assert/strict';
import { personGrid } from '../src/render/sprites.js';

const count = (g, c) => g.flat().filter(v => v === c).length;

test('person grid is 24 wide by 30 tall', () => {
  const g = personGrid({ hair: 'short' });
  assert.equal(g.length, 30); for (const row of g) assert.equal(row.length, 24);
});

test('player cap uses the volt cap channel', () => {
  assert.ok(count(personGrid({ hair: 'cap' }), 'p') > 10);
  assert.equal(count(personGrid({ hair: 'short' }), 'p'), 0);
});

test('rival tie channel only with tie', () => {
  assert.ok(count(personGrid({ hair: 'short', tie: true }), 't') > 0);
  assert.equal(count(personGrid({ hair: 'short' }), 't'), 0);
});

test('unknown lead is a pebble silhouette with a question mark', () => {
  const g = personGrid({ hair: 'short', unknown: true });
  assert.ok(count(g, 'u') > 50); assert.ok(count(g, 'q') > 3);
  assert.equal(count(g, 's'), 0);
});

test('outline wraps the figure', () => assert.ok(count(personGrid({ hair: 'bun' }), 'k') > 40));
