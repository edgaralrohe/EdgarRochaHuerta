// End of day (desk layer): results → pick 1 of 3 upgrades → memo with tomorrow's rule.
import { DAYS } from '../core/config.js';
import { dayConfig } from '../core/days.js';
import { endDay, nextDay } from '../core/game.js';
import { offerUpgrades, upgradeById, buyUpgrade } from '../core/upgrades.js';
import { createRng, hashSeed } from '../core/rng.js';
import { powerCanvas } from '../render/sprites.js';
import { el, showDesk, button, money, moneyShort, quotaBar } from '../ui.js';
import { sfx } from '../audio.js';

const stat = (value, label) => el('div', { class: 'stat' }, el('b', {}, value), el('span', {}, label));

export function createOfficeScene(G) {
  let result = null;

  function results() {
    const st = G.state, s = result.stats;
    const last = st.day >= DAYS;
    showDesk(
      el('div', { class: 'eyebrow' }, `Day ${st.day} of ${DAYS} · 6:00 PM · The Office`),
      el('h2', {}, `Day ${st.day} results`),
      el('p', { class: 'summary' }, result.summary),
      el('div', { class: 'stats' },
        stat(s.deals, 'Deals signed'), stat(money(s.revenue), 'Revenue today'), stat(s.goodCaught, 'Good leads caught'),
        stat(s.badCaught, 'Misfires'), stat(s.deadEnds, 'Dead ends'), stat(result.lostLeads, 'Leads lost overnight')),
      result.lostLeads ? el('p', { class: 'lede' }, `${result.lostLeads} uncalled ${result.lostLeads === 1 ? 'lead' : 'leads'} dropped at 6 PM. CRM sync keeps them for tomorrow.`) : null,
      quotaBar(st.revenue),
      el('div', { class: 'btns' }, button(last ? 'SEE THE WEEK' : 'CONTINUE', { primary: true, onClick: () => { sfx('select'); last ? G.go('final') : upgrades(); } })),
    );
  }

  function upgrades() {
    const st = G.state;
    st.today.offer = st.today.offer || offerUpgrades(createRng(hashSeed(st.seed, st.day, 'offer')), st.powers);
    if (!st.today.offer.length) { memo(); return; }
    const cards = st.today.offer.map(id => {
      const u = upgradeById(id);
      const short = st.cash < u.cost;
      return el('button', {
        type: 'button', class: 'upg' + (u.rarity === 'rare' ? ' rare' : ''), disabled: short,
        'aria-label': `${u.name}, ${u.rarity}, costs ${money(u.cost)}. ${u.desc}`,
        onclick: () => { if (buyUpgrade(st, id).ok) { sfx('good'); memo(u); } },
      },
      el('div', { class: 'rar' }, el('span', {}, u.rarity.toUpperCase()), el('span', {}, moneyShort(u.cost))),
      powerCanvas(id),
      el('h4', {}, u.name), el('p', {}, u.desc),
      short ? el('span', { class: 'need' }, `NEED ${moneyShort(u.cost - st.cash)} MORE`) : null);
    });
    showDesk(
      el('div', { class: 'eyebrow' }, `Platform upgrades · Cash ${money(st.cash)}`),
      el('h2', {}, 'Pick one for tomorrow.'),
      el('p', { class: 'lede' }, 'The platform does the busywork so your day runs like a system. Spending cash does not lower your quota progress.'),
      el('div', { class: 'cards' }, cards),
      el('div', { class: 'btns' }, button('SKIP', { onClick: () => { sfx('select'); memo(); } })),
    );
  }

  function memo(bought) {
    const st = G.state;
    const m = dayConfig(st.day).memo;
    showDesk(
      el('div', { class: 'eyebrow' }, `Memo · For day ${st.day + 1}`),
      el('article', { class: 'memo' },
        el('div', { class: 'from' }, el('span', {}, 'FROM: MARIANA'), el('span', {}, `DAY ${st.day} · 6:00 PM`)),
        el('h3', {}, m.title),
        el('p', {}, m.body),
        bought ? el('p', {}, `${bought.name[0] + bought.name.slice(1).toLowerCase()} is live on your account starting tomorrow.`) : null,
        el('p', { class: 'rule' }, m.rule),
        el('span', { class: 'stamp' }, 'NEW RULE')),
      el('div', { class: 'btns' }, button(`▶ START DAY ${st.day + 1}`, { primary: true, onClick: () => {
        sfx('select');
        nextDay(st);
        G.save();
        G.go('map', { newDay: true });
      } })),
    );
  }

  return {
    name: 'office',
    enter() {
      const st = G.state;
      // Guard against re-entering after a reload: only close the day once.
      if (!st.today.closed) { result = endDay(st); st.today.closed = true; st.today.result = result; G.save(); }
      else result = st.today.result;
      results();
    },
    update() {}, render() {}, exit() {},
  };
}
