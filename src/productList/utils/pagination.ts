export const PAGE_RANGE = 2;

export const getPageNumbers = (page: number, totalPages: number) => {
  const pageNumbers: number[] = [];
  const startPage = Math.max(1, page - PAGE_RANGE);
  const endPage = Math.min(totalPages, page + PAGE_RANGE);
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

  return pageNumbers;
};
