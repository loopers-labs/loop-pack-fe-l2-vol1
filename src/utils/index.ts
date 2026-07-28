export function formatPrice(won: number): string {
  return `${won.toLocaleString("ko-KR")}원`;
}

export function perUnitPrice(totalPrice: number, quantity: number): number {
  return Math.round(totalPrice / quantity);
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
