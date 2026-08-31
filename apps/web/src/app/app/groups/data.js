/* src/app/app/groups/data.js */

/* ─── Mock Data ─── */
export const initialGroups = [
  {
    id: 'GRP-1001',
    name: 'Smith Wedding',
    company: 'Smith Family Events',
    contact: 'Jane Smith',
    email: 'jane@smithwedding.com',
    phone: '+1 555-0201',
    arrival: '2026-08-20',
    departure: '2026-08-22',
    status: 'definite',
    blockType: 'courtesy',
    roomsBlocked: 12,
    roomsPickedUp: 8,
    rate: 149,
    cutOffDate: '2026-08-13',
    eventSpace: 'Grand Ballroom',
    notes: 'Welcome bags at check-in. Late checkout approved for bridal suite.',
    color: 'bg-secondary/20 border-secondary/30',
    textColor: 'text-secondary',
  },
  {
    id: 'GRP-1002',
    name: 'TechConf 2026',
    company: 'DevSummit Inc.',
    contact: 'Michael Chen',
    email: 'm.chen@devsummit.io',
    phone: '+1 555-0202',
    arrival: '2026-09-15',
    departure: '2026-09-18',
    status: 'tentative',
    blockType: 'negotiated',
    roomsBlocked: 45,
    roomsPickedUp: 12,
    rate: 189,
    cutOffDate: '2026-09-01',
    eventSpace: 'Conference Center A + B',
    notes: 'Requires AV setup in all rooms. Breakfast included.',
    color: 'bg-accent/20 border-accent/30',
    textColor: 'text-accent',
  },
  {
    id: 'GRP-1003',
    name: 'Johnson Family Reunion',
    company: null,
    contact: 'Robert Johnson',
    email: 'r.johnson@email.com',
    phone: '+1 555-0203',
    arrival: '2026-08-25',
    departure: '2026-08-28',
    status: 'definite',
    blockType: 'courtesy',
    roomsBlocked: 8,
    roomsPickedUp: 8,
    rate: 135,
    cutOffDate: '2026-08-18',
    eventSpace: null,
    notes: 'Connecting rooms preferred. Kids welcome amenity.',
    color: 'bg-info/20 border-info/30',
    textColor: 'text-info',
  },
  {
    id: 'GRP-1004',
    name: 'Acme Corp Q3 Meeting',
    company: 'Acme Corporation',
    contact: 'Sarah Williams',
    email: 's.williams@acme.com',
    phone: '+1 555-0204',
    arrival: '2026-10-05',
    departure: '2026-10-07',
    status: 'prospect',
    blockType: 'negotiated',
    roomsBlocked: 25,
    roomsPickedUp: 0,
    rate: 165,
    cutOffDate: '2026-09-20',
    eventSpace: 'Boardroom + Breakout 1',
    notes: 'Waiting on contract signature. Comp room for organizer.',
    color: 'bg-warning/20 border-warning/30',
    textColor: 'text-warning',
  },
  {
    id: 'GRP-1005',
    name: 'Regional Sales Kickoff',
    company: 'Nexus Pharma',
    contact: 'David Park',
    email: 'd.park@nexuspharma.com',
    phone: '+1 555-0205',
    arrival: '2026-11-10',
    departure: '2026-11-14',
    status: 'definite',
    blockType: 'contract',
    roomsBlocked: 60,
    roomsPickedUp: 45,
    rate: 205,
    cutOffDate: '2026-10-27',
    eventSpace: 'Grand Ballroom + Terrace',
    notes: 'Master billing. VIP arrivals on 11/10. Ground transportation arranged.',
    color: 'bg-secondary/20 border-secondary/30',
    textColor: 'text-secondary',
  },
  {
    id: 'GRP-1006',
    name: 'Youth Soccer Tournament',
    company: 'State Youth Soccer League',
    contact: 'Coach Martinez',
    email: 'coach.m@sysl.org',
    phone: '+1 555-0206',
    arrival: '2026-08-14',
    departure: '2026-08-16',
    status: 'cancelled',
    blockType: 'courtesy',
    roomsBlocked: 20,
    roomsPickedUp: 0,
    rate: 119,
    cutOffDate: '2026-08-07',
    eventSpace: null,
    notes: 'Cancelled due to venue change. Release all rooms.',
    color: 'bg-danger/10 border-danger/20',
    textColor: 'text-danger',
  },
];

export const roomingListTemplate = [
  [
    'Last Name',
    'First Name',
    'Email',
    'Phone',
    'Room Type',
    'Arrival',
    'Departure',
    'Special Requests',
  ],
  [
    'Smith',
    'John',
    'john@email.com',
    '+15550101',
    'Deluxe King',
    '2026-08-20',
    '2026-08-22',
    'High floor',
  ],
  [
    'Smith',
    'Jane',
    'jane@email.com',
    '+15550102',
    'Deluxe King',
    '2026-08-20',
    '2026-08-22',
    'Adjoining to John',
  ],
];

export const floorPlan = [
  {
    floor: 1,
    rooms: [
      { id: '101', type: 'Standard Twin', status: 'available' },
      { id: '102', type: 'Standard Twin', status: 'occupied' },
      { id: '103', type: 'Standard Queen', status: 'available' },
      { id: '104', type: 'Deluxe King', status: 'available' },
      { id: '105', type: 'Suite', status: 'available' },
    ],
  },
  {
    floor: 2,
    rooms: [
      { id: '201', type: 'Deluxe King', status: 'available' },
      { id: '202', type: 'Deluxe King', status: 'available' },
      { id: '203', type: 'Suite', status: 'available' },
      { id: '204', type: 'Deluxe King', status: 'occupied' },
      { id: '205', type: 'Standard Queen', status: 'available' },
    ],
  },
  {
    floor: 3,
    rooms: [
      { id: '301', type: 'Suite', status: 'available' },
      { id: '302', type: 'Deluxe King', status: 'occupied' },
      { id: '303', type: 'Standard Twin', status: 'available' },
      { id: '304', type: 'Deluxe Queen', status: 'available' },
      { id: '305', type: 'Suite', status: 'available' },
    ],
  },
];

/* ─── Metadata ─── */
export const statusMeta = {
  definite: { label: 'Definite', class: 'bg-accent/10 text-accent border-accent/20' },
  tentative: { label: 'Tentative', class: 'bg-warning/10 text-warning border-warning/20' },
  prospect: { label: 'Prospect', class: 'bg-info/10 text-info border-info/20' },
  cancelled: { label: 'Cancelled', class: 'bg-danger/10 text-danger border-danger/20' },
  completed: { label: 'Completed', class: 'bg-neutral/10 text-text-muted border-border' },
};

export const blockTypeMeta = {
  courtesy: { label: 'Courtesy', class: 'bg-secondary/10 text-secondary border-secondary/20' },
  negotiated: { label: 'Negotiated', class: 'bg-info/10 text-info border-info/20' },
  contract: { label: 'Contract', class: 'bg-accent/10 text-accent border-accent/20' },
};

/* ─── Helpers ─── */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function downloadTemplate() {
  const csv = roomingListTemplate.map((row) => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rooming-list-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}
