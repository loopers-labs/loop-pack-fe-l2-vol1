import { useEffect, useState } from 'react';

import { type ProductOptionsResponse, getProductOptions } from './products';

/** AI가 작성하였습니다 */
export const useProductOptions = () => {
  const [data, setData] = useState<ProductOptionsResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    getProductOptions()
      .then((res) => {
        if (alive) setData(res);
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e : new Error('불러오기 실패'));
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  return { data, isLoading, error };
};
