type GetPaginationPageNumbersParams = {
  readonly currentPage: number
  readonly siblingCount: number
  readonly totalPages: number
}

export function getPaginationPageNumbers({
  currentPage,
  siblingCount,
  totalPages,
}: GetPaginationPageNumbersParams) {
  const pageNumbers: Array<number> = []
  const startPage = Math.max(1, currentPage - siblingCount)
  const endPage = Math.min(totalPages, currentPage + siblingCount)

  for (let pageNumber = startPage; pageNumber <= endPage; pageNumber++) {
    pageNumbers.push(pageNumber)
  }

  return pageNumbers
}
