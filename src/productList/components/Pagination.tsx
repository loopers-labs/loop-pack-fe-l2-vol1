type PaginationProps = {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (next: number) => void;
};

export function Pagination({ currentPage, pageSize, totalCount, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  const pageNumbers = [];
  for (let page = startPage; page <= endPage; page += 1) {
    pageNumbers.push(page);
  }

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="pagination">
      <button onClick={() => onPageChange(1)} disabled={currentPage === 1} aria-label="첫 페이지">
        «
      </button>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="이전 페이지"
      >
        ‹
      </button>
      {pageNumbers.map((p) => (
        <button
          key={p}
          className={p === currentPage ? "active" : ""}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="다음 페이지"
      >
        ›
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        aria-label="마지막 페이지"
      >
        »
      </button>
    </nav>
  );
}
