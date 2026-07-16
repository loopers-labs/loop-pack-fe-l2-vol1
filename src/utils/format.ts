export function formatWon(n: number) {
  return `${n.toLocaleString('ko-KR')}원`;
}

export function calcDiscount(original: number, current: number) {
  return Math.round(((original - current) / original) * 100);
}
