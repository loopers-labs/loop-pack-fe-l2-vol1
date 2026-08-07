import {
  createLoader,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  type LoaderInput,
} from 'nuqs/server'
import {
  normalizeProductListParams,
  PRODUCT_CATEGORY_VALUES,
  PRODUCT_SCENARIO_VALUES,
  PRODUCT_SORT_VALUES,
} from './productListParams'

const loadParsedProductListParams = createLoader({
  q: parseAsString.withDefault(''),
  category: parseAsStringLiteral(PRODUCT_CATEGORY_VALUES).withDefault('all'),
  sort: parseAsStringLiteral(PRODUCT_SORT_VALUES).withDefault('latest'),
  page: parseAsInteger.withDefault(1),
  scenario: parseAsStringLiteral(PRODUCT_SCENARIO_VALUES),
})

export function loadProductListParams(input: LoaderInput) {
  return normalizeProductListParams(loadParsedProductListParams(input))
}

export async function loadProductListParamsAsync(input: Promise<LoaderInput>) {
  return normalizeProductListParams(await loadParsedProductListParams(input))
}
