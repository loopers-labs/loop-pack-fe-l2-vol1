import { useQueryState } from 'nuqs'
import { productListParsers } from '@/_pages/product-list/model/search-params'
import { APP_EVENT } from '@/analytics/app-events'
import { track } from '@/analytics/logger'
import { usePagination } from '@/shared/lib/usePagination'

// 상품 목록의 page URL 상태를 범용 페이지네이션 로직에 연결하는 adapter.
// nuqs와 상품 전용 parser는 이 페이지 슬라이스 안에서만 알고, shared에는 현재 값과 변경 함수만 전달한다.
export const useProductPagination = (totalCount: number, pageSize: number) => {
  const [currentPage, setCurrentPage] = useQueryState('page', productListParsers.page)

  return usePagination({
    totalCount,
    pageSize,
    currentPage,
    onPageChange: (page) => {
      track(APP_EVENT.pageChange, { page })
      return setCurrentPage(page)
    },
  })
}
