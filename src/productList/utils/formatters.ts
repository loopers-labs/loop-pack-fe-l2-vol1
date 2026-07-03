// [AI 생성] 3주차 관심사 분리 — 포맷 순수 함수 (검토·수정)

// 금액을 "12,345원" 형태로 표시한다.
export function formatPrice(value: number): string {
  return `${value.toLocaleString()}원`;
}
