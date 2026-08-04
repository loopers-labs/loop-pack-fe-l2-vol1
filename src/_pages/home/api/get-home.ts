import type { Category, Product } from "@/entities/product";
import { fetchCommerceApi } from "@/shared/api/commerce-client";

export type HomeResponse = {
  banner: { title: string; description: string; image: string };
  categories: Category[];
  popularProducts: Product[];
  newProducts: Product[];
};

export function getHome(): Promise<HomeResponse> {
  return fetchCommerceApi<HomeResponse>("/api/home");
}
