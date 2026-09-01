import { HttpResponse, http } from 'msw'
import { categories } from '@/app/api/_data/commerce'
import { selectHome } from '@/app/api/_data/selectHome'
import { selectProducts } from '@/app/api/_data/selectProducts'
import {
  isCategoryId,
  isProductSort,
} from '@/entities/product/model/productListContract'
import { authHandlers } from './authHandlers'

// 테스트가 만나는 mock 백엔드다. 기본값은 API마다 다르다.
// 상품 API는 성공이 기본이고, 실패·지연·빈 결과는 그것을 확인하는 테스트가 server.use로 덮는다.
// 인증과 주문 API는 익명이 기본이라 401을 돌려주고, 로그인 상태가 필요한 테스트가
// authStates로 덮는다. 로그인 상태를 기본값으로 두면 세션을 만든 적 없는 테스트도 통과해
// 인증이 필요하다는 계약이 사라진다.
// 어느 쪽이든 테스트가 무엇을 전제하는지 그 파일 안에서 읽히게 하는 것이 기준이다.
//
// 응답 본문은 route와 같은 select 함수로 만든다. 여기서 목록을 따로 만들면
// 통합 테스트가 통과해도 실제 응답과 다른 목록을 본 것이 된다.
//
// 경로를 '*/api/...'로 여는 이유는 요청 origin이 실행마다 다르기 때문이다.
// 브라우저 코드는 상대 경로로, 서버 코드는 APP_ORIGIN이 붙은 절대 URL로 같은 API를 부른다.

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 12

export const handlers = [
  ...authHandlers,

  http.get('*/api/home', () => HttpResponse.json(selectHome())),

  http.get('*/api/products', ({ request }) => {
    const params = new URL(request.url).searchParams
    const category = params.get('category')
    const sort = params.get('sort')

    const selection = selectProducts({
      q: params.get('q') ?? '',
      // 성공 경로만 다루므로 지원하지 않는 값은 조건 없음으로 읽는다.
      // 거절은 실제 route의 계약이고 route.test.ts가 맡는다.
      category:
        category === 'all' || (category !== null && isCategoryId(category))
          ? category
          : null,
      sort: sort !== null && isProductSort(sort) ? sort : null,
      page: Number(params.get('page') ?? DEFAULT_PAGE),
      pageSize: Number(params.get('pageSize') ?? DEFAULT_PAGE_SIZE),
    })

    return HttpResponse.json({
      products: selection.products,
      categories,
      totalCount: selection.totalCount,
      page: Number(params.get('page') ?? DEFAULT_PAGE),
      pageSize: Number(params.get('pageSize') ?? DEFAULT_PAGE_SIZE),
    })
  }),
]
