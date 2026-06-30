import { useState } from 'react'

type UseProductPaginationParams = {
  totalCount: number
  pageSize: number
}

export function useProductPagination({
  totalCount,
  pageSize,
}: UseProductPaginationParams) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const pageNumbers: number[] = []
  const startPage = Math.max(1, page - 2)
  const endPage = Math.min(totalPages, page + 2)

  for (let pageNumber = startPage; pageNumber <= endPage; pageNumber += 1) {
    pageNumbers.push(pageNumber)
  }

  return {
    page,
    totalPages,
    pageNumbers,
    changePage: setPage,
    resetPage: () => setPage(1),
  }
}
