const FREE_SHIPPING_THRESHOLD = 50000;

/**
 * 무료배송 대상 여부
 * - 분리 기준: 계산로직의 의도를 명확하게 하기위해 네이밍이 되어있는 순수함수로 분리하였습니다.
 */
export const isFreeShipping = (price: number): boolean => price >= FREE_SHIPPING_THRESHOLD;
