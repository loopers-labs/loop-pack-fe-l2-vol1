import { getTotalPages } from './get-total-pages'

type UsePaginationParams = {
  totalCount: number
  pageSize: number
  currentPage: number
  onPageChange: (page: number) => void | Promise<unknown>
}

// 페이지 상태의 저장 위치(URL, 로컬 상태, 외부 store)를 알지 않는 controlled 페이지네이션 로직.
// 소비처가 현재 페이지와 변경 함수를 주입하므로 도메인과 상태 관리 방식에 관계없이 재사용할 수 있다.
export const usePagination = ({
  totalCount,
  pageSize,
  currentPage,
  onPageChange,
}: UsePaginationParams) => {
  const totalPages = getTotalPages(totalCount, pageSize)

  return { currentPage, totalPages, pageSize, goToPage: onPageChange }
}
