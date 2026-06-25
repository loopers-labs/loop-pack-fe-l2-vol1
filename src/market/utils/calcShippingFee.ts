/**
 * 기본 배송비
 */
const BASE_FEE = 3_000;

/**
 * 결제금액 50000원 이상일 시 무료 배송비
 */
const FREE_THRESHOLD = 50_000;

/**
 * 산간지역 추가요금
 */
const REMOTE_SURCHARGE = 3_000;

/**
 * 배송비 계산
 *
 * - calcVipDiscount 파일 주석과 분리 이유가 동일합니다.
 *
 * @see {@link calcVipDiscount}
 */
export function calcShippingFee(itemTotal: number, isRemote: boolean): number {
  const base = itemTotal >= FREE_THRESHOLD ? 0 : BASE_FEE;

  return isRemote ? base + REMOTE_SURCHARGE : base;
}
