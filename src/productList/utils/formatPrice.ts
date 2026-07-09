/**
 * 가격을 "1,000원" 형태로 포맷하는 순수함수
 * - 분리 기준: toLocaleString() + '원' 조합이 반복되고 있어 순수함수로 분리하였습니다. 하지만 너무 짧아서 그냥 인라인으로 쓰는게 맞을지 고민하고 있습니다.
 */
export const formatPrice = (value: number): string => `${value.toLocaleString()}원`;
