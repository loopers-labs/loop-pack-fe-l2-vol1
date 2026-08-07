'use client'

import { useQueryStates } from 'nuqs'
import {
  createProductListCondition,
  hasNonDefaultFilters,
  productListScenarioSearchParams,
  productListSearchParams,
  productListUrlOptions,
} from './searchParams'

// URL 조건을 API 요청 조건으로 조립하는 유일한 자리다.
// pageSize는 URL이 아니라 여기서 붙는다. 화면이 직접 끼워 넣으면 호출자마다
// 다른 값을 넣을 수 있고, 같은 URL이 다른 query key와 요청이 된다.
export const useProductListCondition = () => {
  const [filters, setFilters] = useQueryStates(
    productListSearchParams,
    productListUrlOptions,
  )
  // 재현 조건은 읽기만 한다. setFilters가 소유하지 않아 초기화에도 살아남는다.
  const [{ scenario }] = useQueryStates(productListScenarioSearchParams)

  // 조건 조립은 서버와 공유하는 함수 하나가 한다. 각자 조립하면 정규화가 갈린다.
  const condition = createProductListCondition(filters, scenario)

  // 조건 초기화가 실제로 무언가를 바꾸는 상태인지 화면이 알아야 한다.
  return {
    condition,
    setFilters,
    canResetFilters: hasNonDefaultFilters(filters),
  }
}
