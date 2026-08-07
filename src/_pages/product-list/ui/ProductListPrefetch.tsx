import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import type { SearchParams } from 'nuqs/server'
import { getQueryClient } from '@/shared/api/serverQueryClient'
import { getAppOrigin } from '@/shared/config/appOrigin'
import { serverProductListQuery } from '../api/productListServer'
import { loadProductListCondition } from '../model/serverSearchParams'
import ProductListView from './ProductListView'

interface ProductListPrefetchProps {
  searchParams: Promise<SearchParams>
}

// 서버가 목록 응답을 미리 받아 브라우저 Query Cache에 넘긴다.
// metadata와 같은 loader와 서버 query 계약을 쓴다. 조건과 GET URL이 같고
// 실제 조회는 요청당 한 번이다.
// searchParams를 읽는 것이 동적 API라 이 라우트가 요청 시점 렌더링이 된다.
export default async function ProductListPrefetch({
  searchParams,
}: ProductListPrefetchProps) {
  const { condition } = await loadProductListCondition(searchParams)

  const queryClient = getQueryClient()
  // prefetchQuery는 실패를 던지지 않는다. 서버가 못 받아오면 브라우저가 같은 key로 다시 가져간다.
  await queryClient.prefetchQuery(
    serverProductListQuery(condition, getAppOrigin()),
  )

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductListView />
    </HydrationBoundary>
  )
}
