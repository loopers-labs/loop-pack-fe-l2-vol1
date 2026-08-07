# 7주차 성능 최적화 — Advanced A

---

## Advanced A — INP (선택 과제)

### 재현 조건
- `/performance-lab/inp?pageSize=24`, 이미지 전부 로딩 완료 후 측정
- Before: 일반 production build, Performance 패널 CPU 4x slowdown
- Profiler(렌더 원인 확인)용: `pnpm next build --profile`로 별도 빌드
- 같은 상품이 찜되지 않은 상태에서 시작, 매 회 찜 해제 후 재측정

### 원인 확인
`src/app/performance-lab/inp/page.tsx`의 카드 컴포넌트가 Zustand store의 `wishlistIds` 배열 전체를 구독하고 있었음:
```tsx
const wishlistIds = usePerformanceWishlist((state) => state.wishlistIds);
const selected = wishlistIds.includes(product.id);
```
배열 자체가 새로 생성될 때마다 이를 구독하는 모든 카드가 리렌더링 대상으로 잡힘.

### Before (Performance INP breakdown, 3회)

| 회차 | Input delay | Processing duration | Presentation delay | INP |
|------|-------------|----------------------|----------------------|-----|
| 1 | 1ms | 74ms | 42ms | 117ms |
| 2 | 1ms | 72ms | 33ms | 106ms |
| 3 | 2ms | 73ms | 29ms | 103ms |
| 중앙값 | 1ms | 73ms | 33ms | 106ms |

### Before (React Profiler, profiling build)
"What caused this update?" 패널에서 `key="p1"`부터 `key="p24"`까지 **24개 전부**가 리렌더링 원인으로 표시됨. Render 시간 2ms.

### 수정
```tsx
// Before: 배열 전체 구독
const wishlistIds = usePerformanceWishlist((state) => state.wishlistIds);
const selected = wishlistIds.includes(product.id);

// After: 이 상품의 boolean 값만 구독
const selected = usePerformanceWishlist((state) =>
  state.wishlistIds.includes(product.id)
);
```
`widgets/product-card`(실제 서비스 카드)에 이미 적용해뒀던 것과 같은 패턴을, 과제가 별도로 제공한 독립 연습 페이지(`performance-lab`)에도 동일하게 적용함.

### After (React Profiler, profiling build)
"What caused this update?" 패널에 클릭한 카드(`key="p3"`) **단 1개**만 표시됨. Render 시간 1.6ms.

### After (Performance INP breakdown, 3회)

| 회차 | Input delay | Processing duration | Presentation delay | INP |
|------|-------------|----------------------|----------------------|-----|
| 1 | 1ms | 8ms | 28ms | 37ms |
| 2 | 1ms | 9ms | 29ms | 39ms |
| 3 | 1ms | 12ms | 39ms | 51ms |
| 중앙값 | 1ms | 9ms | 29ms | 39ms |

### Before / After 비교

| 구간 | Before 중앙값 | After 중앙값 | 변화 |
|------|----------------|---------------|------|
| Processing duration | 73ms | 9ms | -64ms (약 88% 개선) |
| INP 총합 | 106ms | 39ms | -67ms (약 63% 개선) |
| 리렌더링된 카드 수 | 24개 | 1개 | -23개 |

Performance 패널은 사용자 클릭 구간(체감 반응 속도)을, Profiler는 실제 React 렌더 범위와 원인을 각각 설명하는 데 사용했으며, 두 도구의 결과가 일관됨(리렌더링 범위 축소가 Processing duration 감소로 직접 이어짐)을 확인함. `pageSize=24`와 즉각적인 찜 피드백은 그대로 유지했고, Lighthouse TBT는 이 측정에 사용하지 않음.