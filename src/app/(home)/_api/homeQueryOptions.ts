import { queryOptions } from '@tanstack/react-query';
import type { Category } from '@/entities/category/model/category';
import type { Product } from '@/entities/product/model/product';
import { apiResponseResult } from '@/shared/api/response';

// 홈 전용 캐시 정책 — entities/product의 PRODUCT_PRICE_*를 더는 빌려 쓰지 않는다(문제 6).
// 값은 기존과 동일한 60초로 유지: 인기/신상품도 결국 가격이 자주 바뀌는 상품이라 같은 민감도가 유효하다.
const HOME_STALE_TIME = 60 * 1000;
const HOME_GC_TIME_MINUTES = 5;
const HOME_GC_TIME = HOME_GC_TIME_MINUTES * 60 * 1000;

export type HomeResponse = {
  banner: { title: string; description: string; image: string };
  categories: Category[];
  popularProducts: Product[];
  newProducts: Product[];
};

async function fetchHome(): Promise<HomeResponse> {
  return apiResponseResult('/api/home');
}

/* AI-generated : week06-fsd.md 6단계 기준 — /api/home 요청을 페이지가 하나로 소유. entities는 이 파일을 모른다(mapper만 export) */
/** 훅을 전혀 쓰지 않는 순수 설정 함수 — Server Component에서도 안전하게 import 가능 */
export const homeQueryOptions = () =>
  queryOptions({
    queryKey: ['home'],
    queryFn: fetchHome,
    staleTime: HOME_STALE_TIME,
    gcTime: HOME_GC_TIME,
  });
