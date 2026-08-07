import { parseAsInteger, parseAsString, parseAsStringLiteral } from 'nuqs'
import {
  PRODUCT_CATEGORY_VALUES,
  PRODUCT_SCENARIO_VALUES,
  PRODUCT_SORT_VALUES,
} from './productListParams'

export const productListClientParsers = {
  q: parseAsString.withDefault(''),
  category: parseAsStringLiteral(PRODUCT_CATEGORY_VALUES).withDefault('all'),
  sort: parseAsStringLiteral(PRODUCT_SORT_VALUES).withDefault('latest'),
  page: parseAsInteger.withDefault(1),
  scenario: parseAsStringLiteral(PRODUCT_SCENARIO_VALUES),
}
