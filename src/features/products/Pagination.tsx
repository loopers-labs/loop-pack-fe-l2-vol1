type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-3" aria-label="페이지 이동">
      <button
        className="border border-[#c8c8c8] bg-transparent px-3 py-2 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#2557a7]"
        type="button"
        disabled={isFirstPage}
        onClick={() => onPageChange(currentPage - 1)}
      >
        이전
      </button>
      <span>
        {currentPage} / {totalPages}
      </span>
      <button
        className="border border-[#c8c8c8] bg-transparent px-3 py-2 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#2557a7]"
        type="button"
        disabled={isLastPage}
        onClick={() => onPageChange(currentPage + 1)}
      >
        다음
      </button>
    </nav>
  );
}
