export const calculatePages = (page: number, totalCount: number, itemsPerPage: number) => {
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const pageNumbers: number[] = [];
  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, page + 2);
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

  return { totalPages, pageNumbers };
};
