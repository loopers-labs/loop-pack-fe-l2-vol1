type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, page + 2);
  const pageNumbers: number[] = [];
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

  return (
    <nav className="pagination">
      <button onClick={() => onPageChange(1)} disabled={page === 1} aria-label="첫 페이지">
        «
      </button>
      <button onClick={() => onPageChange(page - 1)} disabled={page === 1} aria-label="이전 페이지">
        ‹
      </button>
      {pageNumbers.map((p) => (
        <button key={p} className={p === page ? "active" : ""} onClick={() => onPageChange(p)}>
          {p}
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
  );
}
