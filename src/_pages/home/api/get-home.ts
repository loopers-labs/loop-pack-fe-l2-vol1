import type { HomeResponse, MockApiScenario } from "@/types/commerce";
import { fetchCommerceApi } from "@/shared/api/commerce-client";

export function getHome(scenario: MockApiScenario | null): Promise<HomeResponse> {
  const query = scenario === null ? "" : `?scenario=${scenario}`;
  return fetchCommerceApi<HomeResponse>(`/api/home${query}`);
}
