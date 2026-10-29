import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saveGame, loadGame, clearSave, SAVE_KEY } from '../src/core/save.js';
import { newGame } from '../src/core/game.js';

const memStorage = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };

test('round trip', () => {
  const st = memStorage(); const g = newGame(77); g.cash = 1234; g.powers.push('enrich');
  assert.equal(saveGame(st, g), true);
  assert.deepEqual(loadGame(st), g);
});

test('missing save returns null', () => assert.equal(loadGame(memStorage()), null));

test('broken storage never throws', () => {
  assert.equal(saveGame(broken, newGame(1)), false);
  assert.equal(loadGame(broken), null);
  assert.doesNotThrow(() => clearSave(broken));
  assert.equal(loadGame(null), null);
});

test('corrupt json returns null', () => {
  const st = memStorage(); st.setItem(SAVE_KEY, '{nope');
  assert.equal(loadGame(st), null);
});

test('wrong version returns null', () => {
  const st = memStorage(); st.setItem(SAVE_KEY, JSON.stringify({ version: 999 }));
  assert.equal(loadGame(st), null);
});

test('clear removes the save', () => {
  const st = memStorage(); saveGame(st, newGame(1)); clearSave(st);
  assert.equal(loadGame(st), null);
});
