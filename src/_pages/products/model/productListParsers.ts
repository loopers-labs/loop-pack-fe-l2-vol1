// 서버·클라 공용이라 parser 는 nuqs/server 에서 가져온다
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { PRODUCT_LIST_DEFAULTS } from "@/entities/product";
import {
  CATEGORY_VALUES,
  SORT_VALUES,
} from "@/components/commerce/productListOptions";

export const productListParsers = {
  q: parseAsString.withDefault(PRODUCT_LIST_DEFAULTS.q),
  category: parseAsStringLiteral(CATEGORY_VALUES).withDefault(
    PRODUCT_LIST_DEFAULTS.category,
  ),
  sort: parseAsStringLiteral(SORT_VALUES).withDefault(
    PRODUCT_LIST_DEFAULTS.sort,
  ),
  page: parseAsInteger.withDefault(PRODUCT_LIST_DEFAULTS.page),
};
