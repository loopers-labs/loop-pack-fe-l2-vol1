import {
  createParser,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';

import { CATEGORY_FILTERS } from './constants';

import { PRODUCT_SORTS } from '@/types/commerce';

/**
 * 상품 검색터, 필터 상태 원본
 * 조건 변경은 이전 결과로 돌아갈 수 있어야 해 history에 push한다.
 */
export function useProductListUrlState() {
  return useQueryStates(
    {
      q: parseAsString.withDefault(''),
      category: parseAsStringLiteral(CATEGORY_FILTERS).withDefault('all'),
      sort: parseAsStringLiteral(PRODUCT_SORTS).withDefault('latest'),

      // page는 1 이상의 안전한 정수만 받고, null을 돌려주면 nuqs가 기본값 1로 떨어뜨린다.
      // Number()만 쓰면 '1e3'·' 2 '·'0x10'도 통과하므로 API route와 같은 규칙으로 표기부터 검사한다.
      page: createParser({
        parse: (value: string) => {
          if (!/^[1-9]\d*$/.test(value)) return null;

          const page = Number(value);

          return Number.isSafeInteger(page) ? page : null;
        },
        serialize: String,
      }).withDefault(1),
    },
    { history: 'push' },
  );
}
