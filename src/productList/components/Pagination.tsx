import { getPageNumbers } from "../utils/pagination";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (next: number) => void;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers(page, totalPages);

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
      {pageNumbers.map((p) => (
        <button
          key={p}
          className={p === page ? "active" : ""}
          onClick={() => onPageChange(p)}
        >
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
