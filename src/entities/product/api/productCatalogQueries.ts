import { queryOptions } from '@tanstack/react-query';
import { getProductCatalog } from './getProductCatalog';

export const productCatalogQueries = {
  all: () => ['product-catalog'] as const,
  // 주문 내역과 주문서가 같은 캐시를 쓴다. 두 화면이 각자 받으면 같은 데이터를 두 번 받고
  // 화면 간 가격 표시가 어긋날 여지가 생긴다.
  lookup: () =>
    queryOptions({
      queryKey: [...productCatalogQueries.all(), 'lookup'],
      queryFn: ({ signal }) => getProductCatalog(signal),
      // 시드 상품 데이터라 자주 바뀌지 않는다. 전역 기본값(20초)보다 길게 잡아 화면 전환마다 2회씩 다시 받지 않게 한다.
      staleTime: 5 * 60 * 1000
    })
};
