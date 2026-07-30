import type { Category, Product } from "@/entities/product";
import { fetchCommerceApi } from "@/shared/api/commerce-client";

// 홈 페이지가 소유하는 API 계약 — mock(_contract.ts)과 의도적 중복 (RFC §2.8)
export type HomeResponse = {
  banner: { title: string; description: string; image: string };
  categories: Category[];
  popularProducts: Product[];
  newProducts: Product[];
};

export function getHome(): Promise<HomeResponse> {
  return fetchCommerceApi<HomeResponse>("/api/home");
}
