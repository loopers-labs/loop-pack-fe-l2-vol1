type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  return (
    <nav
      className="mt-10 flex flex-wrap items-center justify-center gap-3"
      aria-label="페이지 이동"
    >
      <button
        className="rounded-gds-sm border border-gds-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gds-gray-900 hover:bg-gds-gray-50 disabled:cursor-not-allowed disabled:text-gds-gray-500 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-gds-green-500"
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
        className="rounded-gds-sm border border-gds-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gds-gray-900 hover:bg-gds-gray-50 disabled:cursor-not-allowed disabled:text-gds-gray-500 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-gds-green-500"
        type="button"
        disabled={isLastPage}
        onClick={() => onPageChange(currentPage + 1)}
      >
        다음
      </button>
    </nav>
  );
}
