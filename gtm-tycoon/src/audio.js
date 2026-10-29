// Original square-wave blips. No third-party or franchise sounds.
import { settings } from './settings.js';

let ctx = null;
function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, start, dur, type = 'square', vol = 0.05) {
  const a = ac(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, a.currentTime + start);
  g.gain.setValueAtTime(0, a.currentTime + start + dur);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + start); o.stop(a.currentTime + start + dur + 0.02);
}

const SFX = {
  select: () => tone(660, 0, 0.05),
  good: () => { tone(880, 0, 0.06); tone(1175, 0.06, 0.08); },
  bad: () => tone(160, 0, 0.14, 'square', 0.04),
  hit: () => tone(520, 0, 0.06),
  strong: () => { tone(520, 0, 0.05); tone(780, 0.05, 0.08); },
  weak: () => tone(240, 0, 0.08),
  deal: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.1)),
  lost: () => { tone(330, 0, 0.12); tone(220, 0.12, 0.18); },
  step: () => tone(120, 0, 0.02, 'square', 0.015),
};

export function sfx(name) {
  if (!settings.sound) return;
  try { SFX[name] && SFX[name](); } catch { /* audio unavailable */ }
}
