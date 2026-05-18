/** Estados que consumen cupo (no canceladas ni liberadas). */
export const ACTIVE_RESERVATION_STATUSES = [
  'CONFIRMADA',
  'CONFIRMED',
  'CHECKED_IN',
  'USADA',
  'PENDING',
] as const;
