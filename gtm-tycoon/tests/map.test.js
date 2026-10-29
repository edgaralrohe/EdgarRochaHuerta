import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAP_W, MAP_H, BUILDINGS, DOORS, isWalkable, doorAt, findPath, PLAYER_START, NPC } from '../src/core/map.js';

test('map is 20x14 tiles', () => { assert.equal(MAP_W, 20); assert.equal(MAP_H, 14); });

test('four places with doors', () => {
  assert.deepEqual(Object.keys(DOORS).sort(), ['clients', 'gym', 'inbox', 'office']);
  assert.deepEqual(BUILDINGS.map(b => b.id).sort(), ['clients', 'gym', 'inbox', 'office']);
});

test('building bodies are solid, doors walkable', () => {
  for (const b of BUILDINGS) {
    assert.equal(isWalkable(b.x, b.y), false, b.id);
    const d = DOORS[b.id];
    assert.equal(isWalkable(d.x, d.y), true, b.id + ' door');
    assert.equal(doorAt(d.x, d.y), b.id);
  }
});

test('out of bounds and HUD row are blocked', () => {
  assert.equal(isWalkable(-1, 5), false);
  assert.equal(isWalkable(20, 5), false);
  assert.equal(isWalkable(5, 0), false);
});

test('player start is walkable and not a door', () => {
  assert.equal(isWalkable(PLAYER_START.x, PLAYER_START.y), true);
  assert.equal(doorAt(PLAYER_START.x, PLAYER_START.y), null);
});

test('every door is reachable from the start', () => {
  for (const [id, d] of Object.entries(DOORS)) {
    const p = findPath(PLAYER_START, d);
    assert.ok(p && p.length > 0, id);
    assert.deepEqual(p[p.length - 1], d);
    for (let i = 1; i < p.length; i++) assert.equal(Math.abs(p[i].x - p[i - 1].x) + Math.abs(p[i].y - p[i - 1].y), 1);
  }
});

test('extra blocked tiles are respected; unreachable returns null', () => {
  assert.equal(findPath(PLAYER_START, { x: BUILDINGS[0].x, y: BUILDINGS[0].y }), null);
  const blocked = new Set([`${PLAYER_START.x + 1},${PLAYER_START.y}`]);
  const p = findPath(PLAYER_START, { x: PLAYER_START.x + 2, y: PLAYER_START.y }, blocked);
  assert.ok(p.every(t => !(t.x === PLAYER_START.x + 1 && t.y === PLAYER_START.y)));
});

test('npc spots are walkable', () => {
  for (const n of Object.values(NPC)) assert.equal(isWalkable(n.x, n.y), true);
});
