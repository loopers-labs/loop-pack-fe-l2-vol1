import type { ProductParams } from '../shared';

export const setUrlSearchParams = ({
  category,
  sortBy,
  searchQuery,
  page,
  itemsPerPage,
  minPrice,
  maxPrice,
  inStockOnly,
}: ProductParams): URLSearchParams => {
  const params = new URLSearchParams();
  params.set('category', category);
  if (searchQuery) params.set('q', searchQuery);
  if (page > 1) params.set('page', String(page));
  if (sortBy !== 'latest') params.set('sort', sortBy);
  if (minPrice !== '') params.set('minPrice', String(minPrice));
  if (maxPrice !== '') params.set('maxPrice', String(maxPrice));
  if (inStockOnly) params.set('inStock', 'true');
  params.set('size', String(itemsPerPage));

  return params;
};
