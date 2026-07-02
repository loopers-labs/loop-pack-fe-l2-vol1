import { getPageNumbers } from "../utils";

/** 첫·이전·번호·다음·마지막 페이지 이동 컨트롤을 그린다. */
export default function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (next: number) => void;
}) {
  const pageNumbers = getPageNumbers(page, totalPages);
  const isFirstPage = page === 1;
  const isLastPage = page === totalPages;

  return (
    <nav className="pagination">
      <button
        onClick={() => onPageChange(1)}
        disabled={isFirstPage}
        aria-label="첫 페이지"
      >
        «
      </button>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={isFirstPage}
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
        disabled={isLastPage}
        aria-label="다음 페이지"
      >
        ›
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={isLastPage}
        aria-label="마지막 페이지"
      >
        »
      </button>
    </nav>
  );
}
