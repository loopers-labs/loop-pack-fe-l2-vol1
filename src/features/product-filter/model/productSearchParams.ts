import { createParser, parseAsInteger, parseAsString, parseAsStringEnum } from 'nuqs/server';
import { CATEGORY_IDS, type CategoryId } from '@/entities/category/model/category';
import { PRODUCT_SORTS, type ProductSort } from '@/entities/product/model/product';

/* AI-generated : page=0/음수처럼 파싱은 되지만 API가 거부하는 값을 1로 하한 보정 — 에러 표의 "파서 사전 보정으로 에러 UI 미표시" 전제와 구현을 일치시킴 */
const parseAsPage = createParser({
  parse: (value) => Math.max(1, parseAsInteger.parse(value) ?? 1),
  serialize: (value) => String(value),
});

/** 클라이언트 훅(useProductListParams)과 서버 로더(loadProductSearchParams)가 공유하는 parser 정의 */
export const productSearchParams = {
  q: parseAsString.withDefault(''),
  category: parseAsStringEnum<CategoryId | 'all'>([...CATEGORY_IDS, 'all']).withDefault('all'),
  page: parseAsPage.withDefault(1),
  sort: parseAsStringEnum<ProductSort>([...PRODUCT_SORTS]).withDefault('latest'),
};
