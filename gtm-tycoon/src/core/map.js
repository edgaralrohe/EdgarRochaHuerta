// One screen: 20x14 tiles of 16 px. Row 0 sits under the HUD strip.
export const MAP_W = 20;
export const MAP_H = 14;
export const TILE = 16;

export const BUILDINGS = [
  { id: 'office', label: 'OFFICE', x: 1, y: 1, w: 6, h: 4 },
  { id: 'inbox', label: 'INBOX PLAZA', x: 12, y: 1, w: 7, h: 4 },
  { id: 'clients', label: 'CLIENTS', x: 1, y: 9, w: 7, h: 4 },
  { id: 'gym', label: 'GYM', x: 14, y: 9, w: 5, h: 4 },
];

// Door = bottom-center tile of each building. It is walkable and entering it opens the place.
export const DOORS = Object.fromEntries(BUILDINGS.map(b => [b.id, { x: b.x + Math.floor(b.w / 2), y: b.y + b.h - 1 }]));

export const TREES = [[8, 1], [8, 3], [11, 4], [19, 6], [0, 8], [8, 12], [11, 12], [12, 9]];
export const MAILBOXES = [[12, 5], [13, 5], [17, 5], [18, 5]];

export const PLAYER_START = { x: 9, y: 8 };
export const NPC = {
  mariana: { x: 2, y: 5 },
  rival: { x: 16, y: 8 },
};
// Where caught leads stand, in front of the Clients building.
export const CLIENT_SPOTS = [[1, 8], [2, 8], [3, 8], [5, 8], [6, 8], [7, 8], [1, 13], [2, 13], [6, 13], [7, 13]];

const key = (x, y) => `${x},${y}`;
const SOLID = new Set();
for (const b of BUILDINGS) for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) SOLID.add(key(x, y));
for (const d of Object.values(DOORS)) SOLID.delete(key(d.x, d.y));
for (const [x, y] of TREES) SOLID.add(key(x, y));
for (const [x, y] of MAILBOXES) SOLID.add(key(x, y));

export function isWalkable(x, y, blocked) {
  if (x < 0 || y < 1 || x >= MAP_W || y >= MAP_H) return false;
  if (SOLID.has(key(x, y))) return false;
  return !(blocked && blocked.has(key(x, y)));
}

export function doorAt(x, y) {
  for (const [id, d] of Object.entries(DOORS)) if (d.x === x && d.y === y) return id;
  return null;
}

// Breadth-first search on the tile grid. Returns the steps after `from`, ending at `to`.
export function findPath(from, to, blocked) {
  if (!isWalkable(to.x, to.y, blocked)) return null;
  const prev = new Map([[key(from.x, from.y), null]]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift();
    if (cur.x === to.x && cur.y === to.y) {
      const path = [];
      for (let node = cur; node && !(node.x === from.x && node.y === from.y); node = prev.get(key(node.x, node.y))) path.unshift({ x: node.x, y: node.y });
      return path;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = { x: cur.x + dx, y: cur.y + dy };
      const k = key(n.x, n.y);
      if (prev.has(k) || !isWalkable(n.x, n.y, blocked)) continue;
      prev.set(k, cur);
      queue.push(n);
    }
  }
  return null;
}
