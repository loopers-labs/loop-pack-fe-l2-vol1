import { queryOptions } from "@tanstack/react-query";
import { getBaseUrl, requestJson } from "@/shared/api";
import type { Category, Product } from "@/entities/product";

export type HomeResponse = {
  banner: { title: string; description: string; image: string };
  categories: Category[];
  popularProducts: Product[];
  newProducts: Product[];
};

function getHome(): Promise<HomeResponse> {
  return requestJson<HomeResponse>(`${getBaseUrl()}/api/home`);
}

const HOME_STALE_TIME = 60 * 1000;

export const homeQueries = {
  all: () => ["home"] as const,
  detail: () =>
    queryOptions({
      queryKey: homeQueries.all(),
      queryFn: getHome,
      staleTime: HOME_STALE_TIME,
    }),
};
