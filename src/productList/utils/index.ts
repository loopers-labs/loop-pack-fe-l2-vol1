export const formatNumber = (value: number): string => value.toLocaleString();

export const formatWon = (won: number): string => `${formatNumber(won)}원`;

const daysAgo = (iso: string): number =>
  Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);

export const isWithinDays = (iso: string, days: number): boolean =>
  daysAgo(iso) <= days;

// 정규식 특수문자 이스케이프 — 검색어를 RegExp에 안전하게 넣기 위함
export const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
