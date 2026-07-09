import { useCallback, useEffect, useState } from 'react';

import type { ProductListGetFetchParams } from '../dto';
import { getProductList } from '../services/products/getProductList';
import type { Product } from '../types';

type UseProductsResult = {
  products: Product[];
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

/**
 * 상품 목록 서버 상태 관리 훅
 * - 분리 기준: 페이지가 서버에 대한 fetch, error, loading을 관리하고 있었고, 렌더링과 서버 통신 로직이 결합 되어있었습니다.
 *   에러 시 재시도가 window.location.reload 뿐이라 사용자는 에러가 났을 때, 항상 브라우저 새로고침을 해야만 했습니다.
 * - refetch 로직은 AI가 작성하였습니다. 기존에는 useEffect에 필터관련 상태의 의존성을 주입하고 `fetchProducts` 함수를 검색이나 필터가 바뀔 때마다, 서버를 호출하여 데이터를
 *   갱신할 수 있도록 하였습니다. refetch를 직접 구현하게 되면서 useProducts 에 있는 상태를 Context로 관리하고 해당 Context에서 refetch 핸들러를 products 리스트를 호출 + 상태 오버라이드
 *   형태로 내보내어 호출하는 방식을 생각하였었지만, props drilling이 많은 중첩으로 발생하는 상황도 아니여서 오버엔지니어링의 경계라고 생각하였습니다.
 *   따라서 AI가 아래처럼 fetchProducts를 useCallback 으로 감싸고, useEffect에서 setTimeout callback으로 호출을 하고있는데 아래 방식이 올바른 방식인지 궁금합니다.
 */
export const useProducts = (params: ProductListGetFetchParams): UseProductsResult => {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { category, sort, q, page, size, minPrice, maxPrice, inStock } = params;

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getProductList({ category, sort, q, page, size, minPrice, maxPrice, inStock });

      setProducts(response.products);
      setTotalCount(response.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('잠시 후 다시 시도해주세요.'));
    } finally {
      setIsLoading(false);
    }
  }, [category, sort, q, page, size, minPrice, maxPrice, inStock]);

  //AI가 작성하였습니다.
  useEffect(() => {
    const timerId = setTimeout(fetchProducts, 0);

    return () => clearTimeout(timerId);
  }, [fetchProducts]);

  return { products, totalCount, isLoading, error, refetch: fetchProducts };
};
