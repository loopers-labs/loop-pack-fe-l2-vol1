// 예산 대상의 단일 출처 — size-limit 설정(.size-limit.mjs)과 검사(check-budget.mjs)가 공유한다.
// 집계는 셋 다 파일별 Brotli(q11) 압축 후 합산이다.
// Hero 원본 이미지는 대상이 아니다 — 정적 자산이라 빌드로 회귀하지 않고,
// 이미지발 LCP 회귀는 정기 Lighthouse가 감시한다.
export const BUDGET_TARGETS = [
  { id: 'home-initial-js', label: '홈 초기 JS' },
  { id: 'products-initial-js', label: '상품 목록 초기 JS' },
  { id: 'shared-js', label: '공유 JS (홈∩목록)' },
];

export const MEASURE_LABEL = 'Brotli(q11) 파일별 합산';
