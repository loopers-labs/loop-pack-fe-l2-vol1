import styles from './Pagination.module.css'

type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

// 공용 UI: 표시와 prev/next 계산·경계(disabled)만 담당하고, 실제 페이지 이동은 onPageChange로 위임한다.
// URL 상태(nuqs) 같은 앱 로직은 알지 못한다.
export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  return (
    <nav className={styles.pagination} aria-label="페이지 이동">
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        이전
      </button>
      <span>
        {currentPage} / {totalPages}
      </span>
      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        다음
      </button>
    </nav>
  )
}
