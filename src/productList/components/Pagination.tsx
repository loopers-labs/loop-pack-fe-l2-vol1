interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * 페이지네이션 내비게이션 컴포넌트
 * - 분리 기준: 페이지 상태는 usePagination 훅이 관리하고, 해당 컴포넌트는 현재 페이지/전체 페이지를 받아
 *   렌더링만 담당하도록 분리하였습니다.
 */
const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  return (
    <nav className="pagination">
      <button onClick={() => onPageChange(1)} disabled={currentPage === 1} aria-label="첫 페이지">
        «
      </button>
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} aria-label="이전 페이지">
        ‹
      </button>
      {pageNumbers.map((p) => (
        <button key={p} className={p === currentPage ? 'active' : ''} onClick={() => onPageChange(p)}>
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
      <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} aria-label="마지막 페이지">
        »
      </button>
    </nav>
  );
};

export default Pagination;
