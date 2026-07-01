export const formatWon = (won: number): string => `${won.toLocaleString()}원`;

const daysAgo = (iso: string): number =>
  Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);

export const isWithinDays = (iso: string, days: number): boolean =>
  daysAgo(iso) <= days;
