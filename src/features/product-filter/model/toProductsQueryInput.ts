import type { ProductListQuery } from '@/entities/product/model/product';
import type { loadProductSearchParams } from './loadProductSearchParams';

/* AI-generated : metadata(generateMetadata)와 본문(page)이 각자 손으로 { q, category, sort, page }를
   골라 productsQueryOptions에 넘기던 걸 이 함수 하나로 합친다. productSearchParams에 필드가 늘어나도
   여기 한 곳만 고치면 두 경로가 같은 GET URL·options를 유지해 fetch memoization이 깨지지 않는다. */
export function toProductsQueryInput(
  query: Awaited<ReturnType<typeof loadProductSearchParams>>,
): ProductListQuery {
  const { q, category, sort, page } = query;
  return { q, category, sort, page };
}
