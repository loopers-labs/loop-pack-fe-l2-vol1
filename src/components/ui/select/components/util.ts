/**
 * 위로 열렸는지, 아래로 열렸는지 알려주는 순수함수
 * - floating 라이브러리의 `placement` 사용
 */
export const openedUp = (placement: string) => placement.startsWith('top');

/**
 * 원 단위 포맷해주는 순수함수
 */
export const formatWonPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;
