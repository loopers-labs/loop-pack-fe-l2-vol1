import { getPageNumbers } from '../../utils/getPageNumbers';

export const Pagination = ({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (next: number) => void;
}) => {
  const pageNumbers = getPageNumbers(page, totalPages);
  return (
    <nav className="pagination">
      <button onClick={() => onPageChange(1)} disabled={page === 1} aria-label="첫 페이지">
        «
      </button>
      <button onClick={() => onPageChange(page - 1)} disabled={page === 1} aria-label="이전 페이지">
        ‹
      </button>
      {pageNumbers.map((p) => (
        <button key={p} className={p === page ? 'active' : ''} onClick={() => onPageChange(p)}>
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
};
