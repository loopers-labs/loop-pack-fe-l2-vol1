import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { getHome, getProducts } from './fetch-product';
import type { ProductListQuery } from './types';

type ProductListConditions = Required<ProductListQuery>;

/** 상품 목록 API가 한 번에 주는 최대 개수 */
const CATALOG_PAGE_SIZE = 24;

const SECOND = 1000;
const MINUTE = 60 * SECOND;

/**
 * 상품 도메인 쿼리 팩토리
 */
export const productQueries = {
  all: () => ['products'] as const,

  home: () =>
    queryOptions({
      queryKey: [...productQueries.all(), 'home'] as const,
      queryFn: getHome,
      staleTime: 5 * MINUTE,
      gcTime: 10 * MINUTE,
    }),

  list: (conditions: ProductListConditions) =>
    queryOptions({
      queryKey: [...productQueries.all(), 'list', conditions] as const,
      queryFn: () => getProducts(conditions),
      staleTime: MINUTE,

      /**
       * 조건이 무엇이 바뀌든 새 목록이 올 때까지 이전 목록을 유지한다.
       * 목록을 즉시 비우면 사용자가 최초 진입과 갱신을 구분할 수 없다.
       */
      placeholderData: keepPreviousData,
    }),

  /**
   * 상품 단건·ID 목록 조회 API가 없어 목록을 페이지 끝까지 합쳐 만든다.
   * 장바구니·주문서·주문 내역이 담긴 상품의 정보를 여기서 찾는다.
   * 단건 조회나 ids 필터 API가 생기면 필요한 상품만 조회하는 방식으로 교체한다.
   */
  catalog: () =>
    queryOptions({
      queryKey: [...productQueries.all(), 'catalog'] as const,
      queryFn: async () => {
        const getCatalogPage = (page: number) =>
          getProducts({
            q: '',
            category: 'all',
            sort: 'latest',
            page,
            pageSize: CATALOG_PAGE_SIZE,
            scenario: null,
          });

        const firstPage = await getCatalogPage(1);
        const totalPages = Math.ceil(firstPage.totalCount / CATALOG_PAGE_SIZE);
        const restPages = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, index) =>
            getCatalogPage(index + 2),
          ),
        );

        return [firstPage, ...restPages].flatMap((page) => page.products);
      },
      staleTime: MINUTE,
    }),
};
