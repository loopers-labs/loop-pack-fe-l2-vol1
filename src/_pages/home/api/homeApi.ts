import { apiFetch, parseApiError, setSearchParam } from "@/shared/api/apiUtils";
import type { Category } from "@/entities/category";
import type { Product } from "@/entities/product";

export type HomeResponse = {
  banner: { title: string; description: string; image: string };
  categories: Category[];
  popularProducts: Product[];
  newProducts: Product[];
};

export async function getHome(): Promise<HomeResponse> {
  const searchParams = new URLSearchParams();
  setSearchParam(
    searchParams,
    "scenario",
    process.env.NEXT_PUBLIC_HOME_API_SCENARIO === "slow" ? "slow" : undefined,
  );

  const queryString = searchParams.toString();
  const apiPath = `/api/home${queryString ? `?${queryString}` : ""}`;
  const response = await apiFetch(apiPath);

  if (!response.ok) {
    throw await parseApiError(response, "홈 데이터를 불러오지 못했습니다.");
  }

  return response.json() as Promise<HomeResponse>;
}
