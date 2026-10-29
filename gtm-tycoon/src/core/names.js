// Fictional people and companies only. No real customer or prospect data.
const FIRST = ['Lucia', 'Diego', 'Sofia', 'Paola', 'Mateo', 'Ana', 'Jonah', 'Priya', 'Kenji', 'Amara', 'Tomas', 'Elena', 'Omar', 'Nadia', 'Ruth', 'Felix', 'Ines', 'Malik', 'Grace', 'Hugo', 'Leila', 'Bruno', 'Mei', 'Rafael'];
const LAST = ['Rios', 'Vega', 'Okafor', 'Lindqvist', 'Moreau', 'Haddad', 'Castillo', 'Park', 'Novak', 'Mensah', 'Duarte', 'Ito', 'Ferreira', 'Kowal', 'Brandt', 'Salas', 'Quinn', 'Adeyemi', 'Varga', 'Nair'];

const STORE_A = ['Little', 'North', 'Copper', 'Maple', 'Paper', 'Lumen', 'Sunday', 'Velvet', 'Pebble', 'Harbor', 'Oak', 'Kettle', 'Juniper', 'Atlas'];
const STORE_B = ['Goods', 'Supply', 'Market', 'Threads', 'Pantry', 'Outfitters', 'Home', 'Shop', 'Studio', 'Trading Co'];
const OTHER = {
  bank: ['Trust', 'Savings', 'Capital', 'Credit Union'],
  factory: ['Steelworks', 'Plastics', 'Assembly', 'Fabrication'],
  hospital: ['General', 'Medical Center', 'Clinic', 'Health'],
};

export const TITLES = {
  visionary: ['CFO', 'CEO', 'Founder', 'VP Growth'],
  technical: ['Head of IT', 'CTO', 'Eng Lead', 'IT Manager'],
  operator: ['Ops Lead', 'COO', 'Ops Manager', 'Store Ops'],
  gatekeeper: ['Purchasing', 'Front Desk', 'Assistant', 'Procurement'],
};

export function personName(rng) {
  return `${rng.pick(FIRST)} ${rng.pick(LAST)}`;
}

export function companyName(rng, industry) {
  if (industry === 'store') return `${rng.pick(STORE_A)} ${rng.pick(STORE_B)}`;
  return `${rng.pick(STORE_A)} ${rng.pick(OTHER[industry])}`;
}
