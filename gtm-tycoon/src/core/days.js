import { DAYS } from './config.js';

// The week teaches one idea per day. `memo` is read at the end of that day and sets up tomorrow.
const WEEK = [
  {
    rules: ['industry', 'size'], mystery: false, badData: false, gatekeepers: false, speed: 1, leadCount: 28,
    morningLine: 'Only online stores with 50 to 500 people today. Go.',
    memo: { title: 'Some leads arrive blank.', body: 'Tomorrow the inbox gets noisy. A few leads come in with no data, so they show up as a box. Look closer before you grab.', rule: 'New rule: unknown leads reveal halfway down. Decide then.' },
  },
  {
    rules: ['industry', 'size'], mystery: true, badData: false, gatekeepers: false, speed: 1, leadCount: 30,
    morningLine: 'Some leads come in blank. Read them before you grab.',
    memo: { title: 'Not everyone can buy.', body: 'Tomorrow some calls land with purchasing or a front desk. They can listen, but they cannot sign.', rule: 'New rule: when a gatekeeper answers, find the manager.' },
  },
  {
    rules: ['industry', 'size'], mystery: true, badData: true, gatekeepers: true, speed: 1.1, leadCount: 32,
    morningLine: 'Gatekeepers pick up today. Find the manager.',
    memo: { title: 'Tomorrow, clean data only.', body: 'Some calls today went nowhere because the emails bounced or we already had them. Starting tomorrow, skip any lead without a working email.', rule: 'New rule: bounced or duplicate leads are out.' },
  },
  {
    rules: ['industry', 'size', 'data'], mystery: true, badData: true, gatekeepers: true, speed: 1.15, leadCount: 34,
    morningLine: 'Clean data only. Skip bounced and duplicate leads.',
    memo: { title: 'Last day of the week.', body: 'The inbox moves faster tomorrow and every rule still applies. Close what you can before 6 PM.', rule: 'Run your day like a system, not a to-do list.' },
  },
  {
    rules: ['industry', 'size', 'data'], mystery: true, badData: true, gatekeepers: true, speed: 1.3, leadCount: 36,
    morningLine: 'Last day. Every rule applies, and the inbox moves fast.',
    memo: null,
  },
];

export function dayConfig(day) {
  const d = Math.min(DAYS, Math.max(1, Math.floor(day) || 1));
  return { day: d, ...WEEK[d - 1] };
}
