import type { ProductListResponse } from '../shared';

export const getProducts = async (params: URLSearchParams) => {
  const res = await fetch(`/api/products?${params.toString()}`);
  if (!res.ok) throw new Error(`API 호출 실패 (status: ${res.status})`);
  const data: ProductListResponse = await res.json();

  return data;
};
