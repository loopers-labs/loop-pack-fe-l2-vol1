import type { ProductListQuery } from '@/types/commerce';

// 카테고리 코드 → 화면 문구. 필터 select와 0건 안내가 같은 표를 쓴다.
export const CATEGORY_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'casual', label: '캐주얼' },
  { value: 'fashion', label: '패션' },
  { value: 'goods', label: '뷰티·잡화' },
  { value: 'home', label: '홈' },
  { value: 'digital', label: '디지털' },
] as const;

// 성공 + 0건 화면용 — 현재 URL 조건을 문구로 명시한다.
// 'all'은 조건이 아니므로 문구에서 빼고, 조건이 하나도 없으면 '전체 목록'이다.
export function describeFilters(filters: ProductListQuery): string {
  const parts: string[] = [];
  if (filters.q) parts.push(`검색 "${filters.q}"`);
  const category = CATEGORY_OPTIONS.find((c) => c.value === filters.category);
  if (category && category.value !== 'all')
    parts.push(`카테고리 ${category.label}`);
  return parts.length > 0 ? parts.join(' · ') : '전체 목록';
}
