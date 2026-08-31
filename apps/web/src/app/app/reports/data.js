/* src/app/admin/reports/data.js */

/* ─── Library Reports ─── */
export const libraryReports = [
  { id: 'r1', title: 'Occupancy Report', category: 'Operations', type: 'bar', icon: 'BedDouble', description: 'Daily occupancy rates and room utilization', lastRun: '2026-08-11', favorite: true },
  { id: 'r2', title: 'Revenue Summary', category: 'Financial', type: 'line', icon: 'DollarSign', description: 'Room revenue, ADR, and RevPAR trends', lastRun: '2026-08-12', favorite: true },
  { id: 'r3', title: 'Guest Analytics', category: 'CRM', type: 'pie', icon: 'Users', description: 'Guest demographics and loyalty breakdown', lastRun: '2026-08-10', favorite: false },
  { id: 'r4', title: 'Channel Performance', category: 'Marketing', type: 'bar', icon: 'TrendingUp', description: 'OTA and direct booking comparison', lastRun: '2026-08-09', favorite: false },
  { id: 'r5', title: 'Housekeeping Efficiency', category: 'Operations', type: 'bar', icon: 'BedDouble', description: 'Turnover times and attendant productivity', lastRun: '2026-08-08', favorite: false },
  { id: 'r6', title: 'Night Audit Summary', category: 'Financial', type: 'area', icon: 'FileText', description: 'EOD charges, payments, and adjustments', lastRun: '2026-08-12', favorite: true },
  { id: 'r7', title: 'No-Show Analysis', category: 'Operations', type: 'bar', icon: 'Users', description: 'No-show patterns and cancellation rates', lastRun: '2026-08-07', favorite: false },
  { id: 'r8', title: 'Rate Variance', category: 'Financial', type: 'line', icon: 'DollarSign', description: 'Rate deviations and override tracking', lastRun: '2026-08-06', favorite: false },
];

/* ─── Report Data Generator ─── */
export function generateReportData(reportId, days = 14) {
  const data = [];
  const start = new Date('2026-08-01');
  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (reportId === 'r1') {
      data.push({ label: dateStr, occupied: 28 + Math.floor(Math.random() * 12), available: 12 - Math.floor(Math.random() * 4), ooo: 5 });
    } else if (reportId === 'r2') {
      data.push({ label: dateStr, revenue: 4200 + Math.floor(Math.random() * 2800), adr: 155 + Math.floor(Math.random() * 45), revpar: 105 + Math.floor(Math.random() * 50) });
    } else if (reportId === 'r3') {
      return [
        { name: 'Platinum', value: 12, color: 'accent' },
        { name: 'Gold', value: 28, color: 'warning' },
        { name: 'Silver', value: 35, color: 'secondary' },
        { name: 'Bronze', value: 18, color: 'info' },
        { name: 'None', value: 7, color: 'neutral' },
      ];
    } else if (reportId === 'r4') {
      data.push({ label: dateStr, Direct: 18 + Math.floor(Math.random() * 8), Bookingcom: 14 + Math.floor(Math.random() * 7), Expedia: 9 + Math.floor(Math.random() * 6), Other: 4 + Math.floor(Math.random() * 4) });
    } else if (reportId === 'r5') {
      data.push({ label: `Floor ${(i % 3) + 1}`, minutes: 22 + Math.floor(Math.random() * 18), target: 25 });
    } else if (reportId === 'r6') {
      data.push({ label: dateStr, charges: 5200 + Math.floor(Math.random() * 1800), payments: 4800 + Math.floor(Math.random() * 2200), adjustments: Math.floor(Math.random() * 300) - 150 });
    } else if (reportId === 'r7') {
      data.push({ label: dateStr, noShows: Math.floor(Math.random() * 3), cancellations: Math.floor(Math.random() * 4), walkIns: Math.floor(Math.random() * 2) + 1 });
    } else if (reportId === 'r8') {
      data.push({ label: dateStr, rackRate: 189, actualRate: 165 + Math.floor(Math.random() * 40), variance: -15 + Math.floor(Math.random() * 30) });
    }
  }
  return data;
}

/* ─── Report Table Columns ─── */
export const reportTableColumns = {
  r1: [
    { key: 'label', label: 'Date' },
    { key: 'occupied', label: 'Occupied' },
    { key: 'available', label: 'Available' },
    { key: 'ooo', label: 'OOO' },
    { key: 'occPct', label: 'Occ %', format: (r) => `${Math.round((r.occupied / (r.occupied + r.available + r.ooo)) * 100)}%` },
  ],
  r2: [
    { key: 'label', label: 'Date' },
    { key: 'revenue', label: 'Revenue', format: (r) => `$${r.revenue.toLocaleString()}` },
    { key: 'adr', label: 'ADR', format: (r) => `$${r.adr}` },
    { key: 'revpar', label: 'RevPAR', format: (r) => `$${r.revpar}` },
  ],
  r4: [
    { key: 'label', label: 'Date' },
    { key: 'Direct', label: 'Direct' },
    { key: 'Bookingcom', label: 'Booking.com' },
    { key: 'Expedia', label: 'Expedia' },
    { key: 'Other', label: 'Other' },
    { key: 'total', label: 'Total', format: (r) => r.Direct + r.Bookingcom + r.Expedia + r.Other },
  ],
  r6: [
    { key: 'label', label: 'Date' },
    { key: 'charges', label: 'Charges', format: (r) => `$${r.charges.toLocaleString()}` },
    { key: 'payments', label: 'Payments', format: (r) => `$${r.payments.toLocaleString()}` },
    { key: 'adjustments', label: 'Adjustments', format: (r) => `$${r.adjustments.toLocaleString()}` },
    { key: 'balance', label: 'Balance', format: (r) => `$${(r.charges - r.payments + r.adjustments).toLocaleString()}` },
  ],
};

/* ─── Builder Fields ─── */
export const builderFields = [
  {
    category: 'Reservations',
    fields: [
      { key: 'confNumber', label: 'Confirmation #' },
      { key: 'guestName', label: 'Guest Name' },
      { key: 'arrival', label: 'Arrival Date' },
      { key: 'departure', label: 'Departure Date' },
      { key: 'nights', label: 'Nights' },
      { key: 'room', label: 'Room' },
      { key: 'roomType', label: 'Room Type' },
      { key: 'status', label: 'Status' },
      { key: 'source', label: 'Source' },
      { key: 'rate', label: 'Rate' },
    ],
  },
  {
    category: 'Revenue',
    fields: [
      { key: 'roomRevenue', label: 'Room Revenue' },
      { key: 'tax', label: 'Tax' },
      { key: 'totalCharges', label: 'Total Charges' },
      { key: 'payments', label: 'Payments' },
      { key: 'balance', label: 'Balance' },
    ],
  },
  {
    category: 'Guest',
    fields: [
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'loyaltyTier', label: 'Loyalty Tier' },
      { key: 'ltv', label: 'Lifetime Value' },
      { key: 'visits', label: 'Total Visits' },
    ],
  },
];

/* ─── Builder Mock Data ─── */
export const builderMockData = [
  { confNumber: '4021', guestName: 'John Smith', arrival: '2026-08-12', departure: '2026-08-15', nights: 3, room: '204', roomType: 'Deluxe King', status: 'checked_in', source: 'Direct', rate: 189, roomRevenue: 567, tax: 85.05, totalCharges: 687, payments: 500, balance: 187, email: 'john@email.com', phone: '+1 555-0101', loyaltyTier: 'Platinum', ltv: 12450, visits: 18 },
  { confNumber: '4022', guestName: 'Sarah Johnson', arrival: '2026-08-11', departure: '2026-08-14', nights: 3, room: '312', roomType: 'Standard Twin', status: 'checked_out', source: 'Booking.com', rate: 145, roomRevenue: 435, tax: 65.25, totalCharges: 520, payments: 520, balance: 0, email: 'sarah@email.com', phone: '+1 555-0102', loyaltyTier: 'Gold', ltv: 8320, visits: 12 },
  { confNumber: '4023', guestName: 'Michael Brown', arrival: '2026-08-15', departure: '2026-08-20', nights: 5, room: '105', roomType: 'Suite', status: 'confirmed', source: 'Expedia', rate: 320, roomRevenue: 1600, tax: 240, totalCharges: 1840, payments: 0, balance: 1840, email: 'mbrown@email.com', phone: '+1 555-0103', loyaltyTier: 'Silver', ltv: 15800, visits: 24 },
  { confNumber: '4024', guestName: 'Emily Davis', arrival: '2026-08-12', departure: '2026-08-13', nights: 1, room: '401', roomType: 'Deluxe King', status: 'confirmed', source: 'Direct', rate: 189, roomRevenue: 189, tax: 28.35, totalCharges: 217, payments: 0, balance: 217, email: 'emily@email.com', phone: '+1 555-0104', loyaltyTier: 'Bronze', ltv: 2100, visits: 3 },
  { confNumber: '4025', guestName: 'Robert Chen', arrival: '2026-08-10', departure: '2026-08-12', nights: 2, room: '118', roomType: 'Standard Queen', status: 'no_show', source: 'Walk-in', rate: 135, roomRevenue: 270, tax: 40.5, totalCharges: 310, payments: 0, balance: 310, email: 'robert@email.com', phone: '+1 555-0105', loyaltyTier: 'None', ltv: 540, visits: 1 },
];

/* ─── Scheduler Meta ─── */
export const frequencyMeta = {
  daily: { label: 'Daily', icon: 'Clock' },
  weekly: { label: 'Weekly', icon: 'Calendar' },
  monthly: { label: 'Monthly', icon: 'Calendar' },
};

export const formatMeta = {
  pdf: { label: 'PDF', class: 'bg-danger/10 text-danger border-danger/20' },
  csv: { label: 'CSV', class: 'bg-accent/10 text-accent border-accent/20' },
};

/* ─── Initial Schedules ─── */
export const initialSchedules = [
  { id: 'S1', reportId: 'r1', reportTitle: 'Occupancy Report', frequency: 'daily', time: '08:00', format: 'pdf', recipients: ['gm@hotel.com'], active: true, lastRun: '2026-08-12 08:00', nextRun: '2026-08-13 08:00' },
  { id: 'S2', reportId: 'r2', reportTitle: 'Revenue Summary', frequency: 'weekly', time: '07:00', format: 'csv', recipients: ['revenue@hotel.com', 'gm@hotel.com'], active: true, lastRun: '2026-08-11 07:00', nextRun: '2026-08-18 07:00' },
  { id: 'S3', reportId: 'r6', reportTitle: 'Night Audit Summary', frequency: 'daily', time: '06:30', format: 'pdf', recipients: ['accounting@hotel.com'], active: false, lastRun: '2026-08-10 06:30', nextRun: '—' },
  { id: 'S4', reportId: 'r4', reportTitle: 'Channel Performance', frequency: 'monthly', time: '09:00', format: 'csv', recipients: ['marketing@hotel.com'], active: true, lastRun: '2026-08-01 09:00', nextRun: '2026-09-01 09:00' },
];
