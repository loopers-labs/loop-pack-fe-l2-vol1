// 가격 표기 한 벌 — 사용처마다 재정의하면 표기 정책 변경 시 화면 간 불일치가 생긴다.
export const formatWon = (value: number) => `${value.toLocaleString('ko-KR')}원`
