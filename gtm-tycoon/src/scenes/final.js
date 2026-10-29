// End of the week (desk layer): revenue against quota and a grade.
import { finalReport } from '../core/game.js';
import { el, showDesk, button, money, quotaBar } from '../ui.js';
import { sfx } from '../audio.js';

const VERDICT = {
  S: 'You ran the week like a system. Mariana is rewriting the quota.',
  A: 'Quota hit. Clean data, right buyers, right pitch.',
  B: 'Close. Most of the gap was leads that never fit.',
  C: 'A rough first week. Every rule you learned still counts next time.',
};

export function createFinalScene(G) {
  return {
    name: 'final',
    enter() {
      const st = G.state, r = finalReport(st);
      showDesk(
        el('div', { class: 'eyebrow' }, 'Week one · Final report'),
        el('h1', {}, r.hit ? el('span', {}, 'Quota ', el('span', { class: 'hl' }, 'hit.')) : 'Quota missed.'),
        el('div', { style: 'display:flex;gap:20px;align-items:center;flex-wrap:wrap' },
          el('span', { class: 'grade' + (r.hit ? ' v' : ''), 'aria-label': `Grade ${r.grade}` }, r.grade),
          el('p', { class: 'summary', style: 'flex:1;min-width:220px' }, VERDICT[r.grade])),
        quotaBar(r.revenue),
        el('p', { class: 'lede' }, `${money(r.revenue)} signed against a ${money(r.quota)} quota.`),
        el('ul', { class: 'days' }, st.week.map(d => el('li', {}, el('b', {}, `DAY ${d.day}`), el('span', {}, d.summary)))),
        el('div', { class: 'btns' }, button('PLAY AGAIN', { primary: true, onClick: () => { sfx('select'); G.clearSave(); G.go('title'); } })),
      );
    },
    update() {}, render() {}, exit() {},
  };
}
