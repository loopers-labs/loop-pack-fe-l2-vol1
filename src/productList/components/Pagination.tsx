// [AI 생성] 3주차 관심사 분리 — 페이지네이션 (UI 전용, 검토·수정)
type PaginationProps = {
  page: number;
  totalPages: number;
  pageNumbers: number[];
  onChange: (page: number) => void;
};

export function Pagination({ page, totalPages, pageNumbers, onChange }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="pagination">
      <button onClick={() => onChange(1)} disabled={page === 1} aria-label="첫 페이지">
        «
      </button>
      <button onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="이전 페이지">
        ‹
      </button>
      {pageNumbers.map((p) => (
        <button key={p} className={p === page ? "active" : ""} onClick={() => onChange(p)}>
          {p}
        </button>
      ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="다음 페이지"
      >
        ›
      </button>
      <button
        onClick={() => onChange(totalPages)}
        disabled={page === totalPages}
        aria-label="마지막 페이지"
      >
        »
      </button>
    </nav>
  );
}
