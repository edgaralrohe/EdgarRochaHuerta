// Per-viewer preferences. Storage can be blocked, so every access is guarded.
const KEY = 'gtm-tycoon-settings';
const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}

export const settings = {
  reducedMotion: false,
  sound: true,
  load() {
    const s = read();
    this.reducedMotion = s.reducedMotion ?? !!(mq && mq.matches);
    this.sound = s.sound ?? true;
    this.apply();
  },
  set(key, value) {
    this[key] = value;
    try { localStorage.setItem(KEY, JSON.stringify({ reducedMotion: this.reducedMotion, sound: this.sound })); } catch { /* not persisted */ }
    this.apply();
  },
  apply() {
    document.documentElement.classList.toggle('reduced-motion', this.reducedMotion);
  },
};
