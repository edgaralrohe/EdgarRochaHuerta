// Client District call list. Picking a lead spends a call and opens the pitch battle.
import { canCall, beginCall } from '../core/game.js';
import { hasPower } from '../core/upgrades.js';
import { personCanvas } from '../render/sprites.js';
import { el, say, setPanel, dialogBox, button, updateHud, moneyShort } from '../ui.js';
import { sfx } from '../audio.js';

export const TYPE_BADGE = { visionary: '$ VISIONARY', technical: '# TECHNICAL', operator: '+ OPERATOR', gatekeeper: '= GATEKEEPER' };

export function sortedPipeline(state) {
  const list = [...state.pipeline];
  if (hasPower(state, 'intent')) list.sort((a, b) => Number(b.intent) - Number(a.intent));
  return list;
}

function leadRow(state, lead, onPick, disabled) {
  const enrich = hasPower(state, 'enrich');
  const unknown = lead.mystery && !enrich;
  const look = unknown ? { hair: 'short', unknown: true } : { hair: lead.buyer.hair, skin: lead.buyer.skin, shirt: lead.buyer.shirt };
  const pic = personCanvas(look).cloneNode();
  pic.getContext('2d').drawImage(personCanvas(look), 0, 0);
  const tags = [enrich ? TYPE_BADGE[lead.buyer.type] : 'TYPE ???'];
  if (hasPower(state, 'intent') && lead.intent) tags.push('READY');
  if (lead.followup) tags.push('FOLLOW-UP');
  return el('button', { type: 'button', class: 'btnpx lead-row', disabled, onclick: onPick },
    pic,
    el('div', {}, el('b', {}, unknown ? 'UNKNOWN LEAD' : `${lead.buyer.name.toUpperCase()} · ${lead.buyer.title.toUpperCase()}`), el('span', {}, `${lead.company} · ${moneyShort(lead.value)}`)),
    el('em', {}, tags.join(' · ')));
}

export function clientsMenu(G) {
  return new Promise(resolve => {
    const st = G.state;
    const can = canCall(st);
    if (!st.pipeline.length) { say('COACH', 'No leads to call yet. Inbox Plaza fills the pipeline.').then(resolve); return; }
    const intro = !can.ok
      ? (can.reason === 'energy' ? 'You are out of energy. Wrap the day at the Office.' : 'It is 6:00 PM. Calls are done for today.')
      : 'Pick a lead. Each call takes 30 minutes and 10 energy.';
    const rows = sortedPipeline(st).map(l => leadRow(st, l, async () => {
      sfx('select');
      const r = beginCall(st, l.id);
      updateHud(st);
      if (!r.ok) { resolve(); return; }
      if (r.deadEnd) {
        sfx('bad');
        await say(r.deadEnd, r.deadEnd === 'BOUNCED'
          ? 'The email bounced, so the call went nowhere. Clean data saves your day.'
          : 'You already called this company. Clean data saves your day.');
        resolve();
        return;
      }
      G.go('battle', { leadId: l.id });
      resolve();
    }, !can.ok));
    setPanel(dialogBox('CLIENTS', intro), el('div', { class: 'list' }, rows), el('div', { class: 'btns' }, button('BACK TO MAP', { onClick: () => resolve() })));
    setTimeout(() => { const b = document.querySelector('#panel button:not(:disabled)'); if (b) b.focus({ preventScroll: true }); }, 120);
  });
}
