// Bootstrap: scene manager, frame loop, pointer mapping and saving.
import { newGame as createGame, startDay } from './core/game.js';
import { saveGame, loadGame, clearSave } from './core/save.js';
import { hashSeed } from './core/rng.js';
import { settings } from './settings.js';
import { input } from './input.js';
import { updateHud } from './ui.js';
import { buildMapBase } from './render/mapRender.js';
import { createTitleScene } from './scenes/title.js';
import { createMapScene } from './scenes/map.js';
import { createArcadeScene } from './scenes/arcade.js';
import { createBattleScene } from './scenes/battle.js';
import { createOfficeScene } from './scenes/office.js';
import { createFinalScene } from './scenes/final.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const storage = (() => { try { return window.localStorage; } catch { return null; } })();

const G = {
  state: null,
  scene: null,
  scenes: {},
  go(name, params) {
    if (G.scene && G.scene.exit) G.scene.exit();
    G.scene = G.scenes[name];
    input.clear();
    G.scene.enter(params);
  },
  save() { if (G.state && storage) saveGame(storage, G.state); },
  loadSave() { return storage ? loadGame(storage) : null; },
  clearSave() { if (storage) clearSave(storage); },
  newGame() {
    G.state = startDay(createGame(hashSeed(Date.now(), Math.random())));
    G.save();
    updateHud(G.state);
    G.go('map', { newDay: true });
  },
  continueGame(saved) {
    G.state = saved;
    updateHud(G.state);
    G.go(saved.today.closed ? 'office' : 'map', { newDay: false });
  },
};

G.scenes = {
  title: createTitleScene(G),
  map: createMapScene(G),
  arcade: createArcadeScene(G),
  battle: createBattleScene(G),
  office: createOfficeScene(G),
  final: createFinalScene(G),
};

// Pointer → logical 320x224 coordinates.
function toLogical(e) {
  const r = canvas.getBoundingClientRect();
  return [((e.clientX - r.left) / r.width) * 320, ((e.clientY - r.top) / r.height) * 224];
}
let dragging = false;
canvas.addEventListener('pointerdown', e => { dragging = true; canvas.setPointerCapture(e.pointerId); const [x, y] = toLogical(e); G.scene?.onPointer?.('down', x, y); });
canvas.addEventListener('pointermove', e => { const [x, y] = toLogical(e); G.scene?.onPointer?.(dragging ? 'drag' : 'move', x, y); });
addEventListener('pointerup', () => { dragging = false; });

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const s = G.scene;
  if (s && !document.getElementById('world').hidden) {
    s.update(dt);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    s.render(ctx);
  } else if (s) s.update(dt);
  input.endFrame();
  requestAnimationFrame(frame);
}

settings.load();
input.init();
G.go('title');
requestAnimationFrame(frame);
// Canvas text uses the pixel font: rebuild the cached map once fonts are ready.
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => buildMapBase());

// Exposed for the headless smoke test.
window.__gtm = G;
