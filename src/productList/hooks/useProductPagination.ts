import { useState } from 'react'

type UseProductPaginationParams = {
  totalCount?: number
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
  totalCount = 0,
  pageSize,
  initialPage = 1,
}: UseProductPaginationParams) {
  const [page, setPage] = useState(initialPage)
  const pageInfo = getProductPageInfo({ page, totalCount, pageSize })

  return {
    page,
    ...pageInfo,
    getPageInfo: (nextTotalCount: number) =>
      getProductPageInfo({ page, totalCount: nextTotalCount, pageSize }),
    changePage: setPage,
    resetPage: () => setPage(1),
  }
}
