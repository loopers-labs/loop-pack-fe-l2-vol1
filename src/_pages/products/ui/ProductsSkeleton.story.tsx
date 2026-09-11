import { ProductsSkeleton } from './ProductsSkeleton';

// story = props를 고정한 래퍼. 갤러리는 이 named export를 인자 없이 그대로 그린다 —
// story가 인자를 받으면 호출부마다 그림이 달라져 기준선이 무엇의 기준선인지 흐려진다.

export function ProductsSkeletonDefault() {
  return <ProductsSkeleton />;
}

// 마지막 줄이 덜 찬 경우. 5열 고정(week05-grid)이 auto-fit 같은 것으로 바뀌면
// 가득 찬 격자는 그대로인데 이 story의 칸 너비만 늘어난다 — 열 회귀는 여기서 먼저 드러난다.
export function ProductsSkeletonPartialRow() {
  return <ProductsSkeleton count={3} />;
}
