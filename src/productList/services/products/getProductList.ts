import { apiClient } from '@/api/apiClient';

import type { ProductListGetFetchParams, ProductListResponse } from '../../dto';
import { getProductListQueryParams } from '../../utils/getProductListQueryParams';

/**
 * 상품 목록 조회 fetcher
 *
 * - 분리 기준: 분리 전에는 페이지가 fetch + URL 조립을 직접 수행하고 있었습니다. api의 개수가 하나여서 개별 파일로 분리하였고, 개별 api 함수만을 리턴하는 책임의 형태로 분리하였습니다.
 *   타입 정의와 직렬화는 각각 dto/util에 위임하여 fetcher만 남깁니다.
 */
export const getProductList = (params: ProductListGetFetchParams) =>
  apiClient.get<ProductListResponse>(`/products?${getProductListQueryParams(params)}`);
