export function calcDiscountRate(price: number, originalPrice?: number) {
  if (!originalPrice) return 0;
  return Math.round((1 - price / originalPrice) * 100);
}

export function formatPrice(price: number) {
  return price.toLocaleString() + '원';
}

export function isNewProduct(createdAt: string) {
  const days = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24),
  );
  return days <= 7;
}

export function calcPageNumbers(page: number, totalPages: number) {
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}
