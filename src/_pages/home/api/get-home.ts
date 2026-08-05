import type { HomeResponse } from "@/types/commerce";
import { fetchCommerceApi } from "@/shared/api/commerce-client";

export function getHome(): Promise<HomeResponse> {
  return fetchCommerceApi<HomeResponse>("/api/home");
}
