export const permissionCategories = [
  { id: 'reservations', label: 'Reservations' },
  { id: 'guests', label: 'Guests' },
  { id: 'billing', label: 'Billing' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' },
  { id: 'admin', label: 'Administration' },
];

export function getKeyStatus(expiresAt?: string) {
  if (!expiresAt) return { label: 'Active', color: 'text-green-600' };
  const exp = new Date(expiresAt);
  const now = new Date();
  if (exp < now) return { label: 'Expired', color: 'text-red-600' };
  const days = Math.floor((exp.getTime() - now.getTime()) / 86400000);
  if (days < 30) return { label: 'Expiring Soon', color: 'text-yellow-600' };
  return { label: 'Active', color: 'text-green-600' };
}
