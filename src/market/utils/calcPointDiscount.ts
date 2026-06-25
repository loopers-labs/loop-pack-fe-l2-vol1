/**
 * 적립금 할인 계산 util
 * - 사용 적립금은 보유 적립금과 주문 금액(itemTotal)을 초과할 수 없다는 상한 규칙을 담습니다.
 * - "적립금 사용 여부" 같은 UI 게이트는 호출부에 남기고, 정책(상한 규칙)만 분리했습니다.
 *
 * @see {@link calcShippingFee}
 */
export function calcPointDiscount(pointInput: number, ownedPoint: number, itemTotal: number): number {
  return Math.min(pointInput, ownedPoint, itemTotal);
}
