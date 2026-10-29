import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, hashSeed } from '../src/core/rng.js';

test('same seed gives the same sequence', () => {
  const a = createRng(42), b = createRng(42);
  for (let i = 0; i < 20; i++) assert.equal(a.next(), b.next());
});

test('different seeds diverge', () => {
  const a = createRng(1), b = createRng(2);
  assert.notEqual(a.next(), b.next());
});

test('next stays in [0,1)', () => {
  const r = createRng(7);
  for (let i = 0; i < 1000; i++) { const v = r.next(); assert.ok(v >= 0 && v < 1); }
});

test('int is inclusive and in range', () => {
  const r = createRng(9); const seen = new Set();
  for (let i = 0; i < 500; i++) { const v = r.int(2, 5); assert.ok(v >= 2 && v <= 5); seen.add(v); }
  assert.deepEqual([...seen].sort(), [2, 3, 4, 5]);
});

test('pick returns an element of the array', () => {
  const r = createRng(3); const arr = ['a', 'b', 'c'];
  for (let i = 0; i < 50; i++) assert.ok(arr.includes(r.pick(arr)));
});

test('chance respects the extremes', () => {
  const r = createRng(5);
  for (let i = 0; i < 50; i++) { assert.equal(r.chance(0), false); assert.equal(r.chance(1), true); }
});

test('hashSeed is stable and mixes parts', () => {
  assert.equal(hashSeed(10, 1), hashSeed(10, 1));
  assert.notEqual(hashSeed(10, 1), hashSeed(10, 2));
});
