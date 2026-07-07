import { PAGE_SIZE } from "../constants";

// 상태도 effect도 없는 순수 파생이라 훅(useX)이 아니라 util로 둔다.
const PAGE_WINDOW = 2;

export type PaginationView = {
  totalPages: number;
  pageNumbers: number[];
};

export function derivePagination(page: number, totalCount: number): PaginationView {
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const startPage = Math.max(1, page - PAGE_WINDOW);
  const endPage = Math.min(totalPages, page + PAGE_WINDOW);

  const pageNumbers: number[] = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return { totalPages, pageNumbers };
}
