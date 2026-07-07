type ProductPaginationProps = {
  page: number
  totalPages: number
  pageNumbers: number[]
  onPageChange: (page: number) => void
}

export function ProductPagination({
  page,
  totalPages,
  pageNumbers,
  onPageChange,
}: ProductPaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  return (
    <nav className="pagination">
      <button
        onClick={() => onPageChange(1)}
        disabled={page === 1}
        aria-label="첫 페이지"
      >
        «
      </button>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="이전 페이지"
      >
        ‹
      </button>
      {pageNumbers.map((pageNumber) => (
        <button
          key={pageNumber}
          className={pageNumber === page ? 'active' : ''}
          onClick={() => onPageChange(pageNumber)}
        >
          {pageNumber}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="다음 페이지"
      >
        ›
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={page === totalPages}
        aria-label="마지막 페이지"
      >
        »
      </button>
    </nav>
  )
}
