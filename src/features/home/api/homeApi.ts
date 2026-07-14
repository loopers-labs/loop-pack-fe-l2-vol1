import { parseApiError, setSearchParam } from "@/lib/apiUtils";
import type { MockApiScenario } from "@/types/api";
import type { Category, Product } from "@/types/commerce";

type GetHomeParams = {
  scenario?: MockApiScenario;
};

export type HomeResponse = {
  banner: { title: string; description: string; image: string };
  categories: Category[];
  popularProducts: Product[];
  newProducts: Product[];
};

export async function getHome(params: GetHomeParams = {}): Promise<HomeResponse> {
  const searchParams = new URLSearchParams();

  setSearchParam(searchParams, "scenario", params.scenario);

  const queryString = searchParams.toString();
  const response = await fetch(`/api/home${queryString ? `?${queryString}` : ""}`);

  if (!response.ok) {
    throw await parseApiError(response, "홈 데이터를 불러오지 못했습니다.");
  }

  return response.json() as Promise<HomeResponse>;
}
