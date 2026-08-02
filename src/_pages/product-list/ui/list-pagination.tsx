import styles from "./product-list.module.css";

type ListPaginationProps = {
  page: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export function ListPagination({ page, totalCount, pageSize, onPageChange }: ListPaginationProps) {
  const totalPages = Math.ceil(totalCount / pageSize);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className={styles.pagination} aria-label="페이지 이동">
      {Array.from({ length: totalPages }, (_, index) => {
        const pageNumber = index + 1;
        const isCurrent = pageNumber === page;

        return (
          <button
            key={pageNumber}
            type="button"
            aria-current={isCurrent ? "page" : undefined}
            onClick={() => onPageChange(pageNumber)}
          >
            {`${pageNumber}페이지`}
          </button>
        );
      })}
    </nav>
  );
}
