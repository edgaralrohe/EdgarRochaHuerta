// DOM helpers for both layers: dialog box, pixel buttons, HUD and screen switching.
import { formatClock } from './core/clock.js';
import { QUOTA } from './core/config.js';
import { sfx } from './audio.js';

const $ = id => document.getElementById(id);

export function el(tag, attrs = {}, ...children) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (k === 'style') n.style.cssText = v;
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c != null && c !== false) n.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return n;
}

export const money = n => '$' + Math.round(n).toLocaleString('en-US');
export const moneyShort = n => (n >= 1000 ? '$' + (Math.round(n / 100) / 10).toString().replace(/\.0$/, '') + 'K' : '$' + n);

export function showWorld() {
  $('world').hidden = false; $('desk').hidden = true;
  document.body.classList.remove('desk-mode');
}

export function showDesk(...children) {
  const d = $('desk');
  d.replaceChildren(...children);
  $('world').hidden = true; d.hidden = false;
  document.body.classList.add('desk-mode');
  window.scrollTo(0, 0);
  const first = d.querySelector('button:not(:disabled)');
  if (first) first.focus({ preventScroll: true });
}

export function setPanel(...children) { $('panel').replaceChildren(...children.filter(Boolean)); }
export function setOverlay(...children) { $('overlay').replaceChildren(...children.filter(Boolean)); }

function focusFirst(root) {
  const b = root.querySelector('button:not(:disabled)');
  if (b) b.focus({ preventScroll: true });
}

export function releaseFocus() {
  if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
}

export function dialogBox(name, text, hint) {
  return el('div', { class: 'dialog' }, name && el('span', { class: 'name' }, name), text, hint && el('small', {}, hint));
}

// One sentence per box. Resolves when the player advances (click, Enter or Space).
export function say(name, text, hint) {
  return new Promise(resolve => {
    const box = el('button', { class: 'dialog', type: 'button', 'aria-label': `${name ? name + ': ' : ''}${text} Press Enter to continue.` },
      name && el('span', { class: 'name' }, name), text, el('span', { class: 'next', 'aria-hidden': 'true' }, '▼'), hint && el('small', {}, hint));
    box.addEventListener('click', () => { sfx('select'); resolve(); }, { once: true });
    setPanel(box);
    // Defer focus so the key that opened the dialog does not also close it.
    setTimeout(() => box.focus({ preventScroll: true }), 120);
  });
}

export async function sayAll(name, lines) {
  for (const l of lines) await say(name, l);
}

export function button(label, opts = {}) {
  return el('button', { type: 'button', class: 'btnpx' + (opts.primary ? ' v' : ''), disabled: opts.disabled, 'data-key': opts.key, onclick: opts.onClick },
    opts.key && el('span', { class: 'key', 'aria-hidden': 'true' }, opts.key), label, opts.sub && el('span', { class: 'sub' }, opts.sub));
}

// Dialog + choice buttons. Resolves with the chosen option's value.
export function choose(name, text, options, extra) {
  return new Promise(resolve => {
    const btns = el('div', { class: 'btns' }, options.map(o => button(o.label, { ...o, onClick: () => { sfx('select'); resolve(o.value); } })));
    setPanel(dialogBox(name, text), extra || null, btns);
    setTimeout(() => focusFirst(btns), 120);
  });
}

export function updateHud(state) {
  $('hud-time').textContent = formatClock(state.minutes);
  $('hud-day').textContent = state.day;
  $('hud-cash').textContent = money(state.cash);
  $('hud-quota').textContent = `${moneyShort(state.revenue)}/${moneyShort(QUOTA)}`;
  const pct = Math.max(0, Math.min(100, (state.energy / state.maxEnergy) * 100));
  $('hud-energy').style.width = pct + '%';
  const bar = $('hud-energy-bar');
  bar.classList.toggle('low', state.energy < 20);
  bar.setAttribute('aria-valuemax', state.maxEnergy);
  bar.setAttribute('aria-valuenow', state.energy);
}

export function quotaBar(revenue) {
  const pct = Math.min(100, (revenue / QUOTA) * 100);
  return el('div', { class: 'quota' },
    el('div', { class: 'lbl' }, el('span', {}, `Week revenue ${money(revenue)}`), el('span', {}, `Quota ${money(QUOTA)}`)),
    el('div', { class: 'track', role: 'meter', 'aria-valuemin': 0, 'aria-valuemax': QUOTA, 'aria-valuenow': revenue, 'aria-label': 'Quota progress' },
      el('i', { class: pct === 0 ? 'empty' : null, style: `width:${pct}%` })));
}
