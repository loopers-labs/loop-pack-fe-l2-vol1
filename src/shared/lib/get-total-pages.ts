export const getTotalPages = (totalCount: number, pageSize: number) =>
  Math.max(1, Math.ceil(totalCount / pageSize))
