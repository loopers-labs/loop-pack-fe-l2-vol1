import { cache } from 'react'
import { fetchJson } from '@/shared/api/http'
import {
  productListQueries,
  productListRequestUrl,
  type ProductListCondition,
  type ProductListResponse,
} from './productList'

// metadata와 본문 prefetch가 한 요청 안에서 이 조회 하나를 나눠 쓴다.
// 캐시 키는 정규화된 GET URL 문자열이다. 조건 객체를 넘기면 내용이 같아도
// metadata와 RSC가 만든 참조가 달라 캐시가 갈린다.
const readProductList = cache((url: string) =>
  fetchJson<ProductListResponse>(url),
)

// 서버용 query 계약이다. key와 신선도 정책은 브라우저와 같고 조회만 요청 범위를 탄다.
// queryFn은 signal을 받지 않는다. 서버에는 화면을 떠나 취소할 사용자가 없고,
// 응답이 오지 않는 요청은 fetchJson의 10초 타임아웃이 끊는다.
export const serverProductListQuery = (
  condition: ProductListCondition,
  origin: string,
) => ({
  ...productListQueries.list(condition, { origin }),
  queryFn: () => readProductList(productListRequestUrl(condition, origin)),
})
