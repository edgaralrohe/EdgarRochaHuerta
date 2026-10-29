// Title screen (desk layer) with a small pixel insert of the cast.
import { QUOTA, DAYS } from '../core/config.js';
import { personCanvas } from '../render/sprites.js';
import { el, showDesk, button, money } from '../ui.js';
import { settings } from '../settings.js';
import { sfx } from '../audio.js';

function sprite(o) {
  const c = document.createElement('canvas'); c.width = 72; c.height = 90;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(personCanvas(o), 0, 0, 72, 90);
  return c;
}

function toggle(label, key) {
  const input = el('input', { type: 'checkbox' });
  input.checked = settings[key];
  input.addEventListener('change', () => settings.set(key, input.checked));
  return el('label', {}, input, label);
}

export function createTitleScene(G) {
  return {
    name: 'title',
    enter() {
      const saved = G.loadSave();
      showDesk(
        el('div', { class: 'eyebrow' }, `A sales game · ${DAYS} days · One quota`),
        el('h1', {}, 'GTM Tycoon'),
        el('p', { class: 'lede' }, `You are the new rep. Mariana, your co-founder, hands you a ${money(QUOTA)} quota and one week. Find the right leads, pitch the right people, and run your day like a system, not a to-do list.`),
        el('div', { class: 'insert', 'aria-hidden': 'true' },
          sprite({ hair: 'bun', skin: 2, shirt: 'indigo' }), sprite({ hair: 'cap', skin: 1, shirt: 'indigo' }), sprite({ hair: 'long', skin: 1, shirt: 'ink' })),
        el('div', { class: 'btns' },
          saved ? button(`CONTINUE · DAY ${saved.day}`, { primary: true, onClick: () => { sfx('select'); G.continueGame(saved); } }) : null,
          button('NEW GAME', { primary: !saved, onClick: () => { sfx('select'); G.newGame(); } })),
        el('div', { class: 'card', style: 'display:grid;gap:12px' },
          el('h3', {}, 'How a day works'),
          el('ol', { class: 'howto' },
            el('li', {}, 'Mariana gives you the rule of the day.'),
            el('li', {}, 'Inbox Plaza: catch leads that fit, let the rest fall.'),
            el('li', {}, 'Clients: call them. Match your pitch to the buyer: $ impact, # demo, + workflow, = find the manager.'),
            el('li', {}, 'Gym: sharpen your pitch. The rival on the street wants a pitch-off.'),
            el('li', {}, 'Office: see your results, pick a platform upgrade, read tomorrow’s memo.'))),
        el('div', { class: 'toggles' }, toggle('Reduced motion', 'reducedMotion'), toggle('Sound', 'sound')),
        el('p', { class: 'eyebrow', style: 'color:var(--pebble)' }, 'All companies and people are fictional.'),
      );
    },
    update() {}, render() {}, exit() {},
  };
}
