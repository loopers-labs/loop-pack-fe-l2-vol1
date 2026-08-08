import { createLoader, type SearchParams } from 'nuqs/server'
import { createProductListCondition } from './searchParams'
import {
  productListScenarioSearchParams,
  productListSearchParams,
} from './searchParams'

// 서버도 브라우저와 같은 parser로 URL을 읽는다. 별도 파서를 두면 정규화 규칙이 갈라져
// 서버가 prefetch한 조건과 브라우저가 읽은 조건이 어긋난다.
//
// 두 그룹을 하나로 합친다. 그룹을 나눈 이유는 브라우저에서 필터 초기화가
// 재현 조건까지 지우지 않게 하려는 것이고, 읽기만 하는 서버에는 해당하지 않는다.
const loadSearchParams = createLoader({
  ...productListSearchParams,
  ...productListScenarioSearchParams,
})

export const loadProductListCondition = async (
  searchParams: Promise<SearchParams>,
) => {
  const { scenario, ...filters } = await loadSearchParams(searchParams)
  return { filters, condition: createProductListCondition(filters, scenario) }
}
