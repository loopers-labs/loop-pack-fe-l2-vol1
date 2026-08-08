import { productQueries } from './productQueries';
import type { QueryClient } from '@tanstack/react-query';
import type { ProductListResponse } from '@/entities/product';

// AI 생성: query cache의 data는 unknown이고 프로젝트가 타입 단언을 금지하므로, 실제로 쓰는 필드만
// 확인하는 타입 가드로 좁힌다.
function isProductListResponse(value: unknown): value is ProductListResponse {
  if (typeof value !== 'object' || value === null) return false;
  if (!('products' in value) || !('categories' in value) || !('totalCount' in value) || !('pageSize' in value)) return false;
  return Array.isArray(value.products) && Array.isArray(value.categories) && typeof value.totalCount === 'number' && typeof value.pageSize === 'number';
}

// AI 생성: 필터를 바꾼 갱신이 실패하면 새 query key에는 데이터가 없다 —
// `placeholderData: keepPreviousData`는 요청이 pending인 동안에만 이전 결과를 내주고, 에러로 끝나면
// 내주지 않는다(실측 확인). 이때 사용자가 보던 목록을 지우지 않으려고 직전 성공 결과를 찾는다.
// 결과를 로컬 상태나 ref에 복사하지 않고 query cache가 계속 소유하게 두는 것이 이 함수의 목적이다.
export function findLastSuccessfulProductList(queryClient: QueryClient): ProductListResponse | null {
  const latest = queryClient
    .getQueryCache()
    .findAll({ queryKey: productQueries.all() })
    .filter((query) => query.state.status === 'success')
    .sort((first, second) => second.state.dataUpdatedAt - first.state.dataUpdatedAt)[0];

  return latest && isProductListResponse(latest.state.data) ? latest.state.data : null;
}
