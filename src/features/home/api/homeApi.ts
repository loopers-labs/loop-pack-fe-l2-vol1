import { createApiUrl, parseApiError } from "@/shared/api/apiUtils";
import type { Category, Product } from "@/types/commerce";

export type HomeResponse = {
  banner: { title: string; description: string; image: string };
  categories: Category[];
  popularProducts: Product[];
  newProducts: Product[];
};

export async function getHome(): Promise<HomeResponse> {
  const response = await fetch(createApiUrl("/api/home"));

  if (!response.ok) {
    throw await parseApiError(response, "홈 데이터를 불러오지 못했습니다.");
  }

  return response.json() as Promise<HomeResponse>;
}
