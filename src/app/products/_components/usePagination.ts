import { useQueryStates } from 'nuqs'
import { PRODUCT_PAGE_SIZE, productListParsers } from '@/service/products/searchParams'

// 상품 목록의 페이지네이션 상태 훅. page의 원본은 URL(nuqs)이므로 여기서 읽고 쓴다.
// totalCount(서버 응답)와 고정 pageSize로 전체 페이지 수를 파생한다.
// productListParsers에 결합돼 있어 공용 훅(src/hooks)이 아니라 라우트 전용으로 둔다.
export const usePagination = (totalCount: number) => {
  const [{ page }, setParams] = useQueryStates(productListParsers)
  const totalPages = Math.max(1, Math.ceil(totalCount / PRODUCT_PAGE_SIZE))
  const goToPage = (nextPage: number) => setParams({ page: nextPage })

  return { currentPage: page, totalPages, pageSize: PRODUCT_PAGE_SIZE, goToPage }
}
