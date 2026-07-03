import type { Member } from '@/market/types';

/**
 * VIP 할인률
 * - 매직 넘버를 사용하여 바로 계산하면 코드를 처음 보는 입장에서 알 수 없기에 상수로 분리하였습니다.
 */
const VIP_DISCOUNT_RATE = 0.9;

/**
 * VIP 할인률 계산 util
 * - 계산로직을 util로 분리하여 페이지 코드가 좀 더 렌더링에 집중할 수 있도록 하였습니다.
 * - `/src/market` 경로의 `market` 이라는 관심사의 디렉토리로 분류되어있었기에 해당 디렉토리 내부에 `utils` 디렉토리를 생성하여 파일을 생성했습니다.
 * - 만약 추후에 다른 feature를 담당하는 디렉토리에서 두 번 이상 재사용되는 로직이라면 전역 utils 레이어로 분리했을 것 같습니다.
 */
export function calcVipDiscount(amount: number, grade: Member['grade']): number {
  return grade === 'VIP' ? Math.round(amount * VIP_DISCOUNT_RATE) : amount;
}
