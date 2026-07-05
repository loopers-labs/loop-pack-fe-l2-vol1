import { useState } from 'react'

type UseProductPaginationParams = {
  pageSize: number
  initialPage?: number
}

function getProductPageInfo({
  page,
  totalCount,
  pageSize,
}: {
  page: number
  totalCount: number
  pageSize: number
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const pageNumbers: number[] = []
  const startPage = Math.max(1, page - 2)
  const endPage = Math.min(totalPages, page + 2)

  for (let pageNumber = startPage; pageNumber <= endPage; pageNumber += 1) {
    pageNumbers.push(pageNumber)
  }

  return {
    totalPages,
    pageNumbers,
  }
}

export function useProductPagination({
  pageSize,
  initialPage = 1,
}: UseProductPaginationParams) {
  const [page, setPage] = useState(initialPage)

  return {
    page,
    // totalCount는 서버 응답에서 오므로 계산 시점에 주입받는다(상태로 들지 않는다).
    getPageInfo: (totalCount: number) =>
      getProductPageInfo({ page, totalCount, pageSize }),
    changePage: setPage,
    resetPage: () => setPage(1),
  }
}
