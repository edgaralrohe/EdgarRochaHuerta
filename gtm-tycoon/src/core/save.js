import { SAVE_VERSION } from './game.js';

export const SAVE_KEY = 'gtm-tycoon-save-v1';

export function saveGame(storage, state) {
  try { storage.setItem(SAVE_KEY, JSON.stringify(state)); return true; } catch { return false; }
}

export function loadGame(storage) {
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && data.version === SAVE_VERSION ? data : null;
  } catch { return null; }
}

export function clearSave(storage) {
  try { storage.removeItem(SAVE_KEY); } catch { /* storage unavailable: nothing to clear */ }
}
