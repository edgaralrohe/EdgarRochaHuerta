import { DAY_END } from './config.js';

export function formatClock(minutes) {
  const h24 = Math.floor(minutes / 60), m = Math.floor(minutes % 60);
  const h12 = ((h24 + 11) % 12) + 1;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}

export function advanceClock(state, minutes) {
  state.minutes = Math.min(DAY_END, state.minutes + minutes);
  return state.minutes;
}

export const isDayOver = state => state.minutes >= DAY_END;
