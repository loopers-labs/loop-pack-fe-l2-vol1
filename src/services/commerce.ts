import type { HomeResponse } from "@/types/commerce";
import { getBaseUrl } from "./getBaseUrl";
import { requestJson } from "./requestJson";

export function getHome(): Promise<HomeResponse> {
  return requestJson<HomeResponse>(`${getBaseUrl()}/api/home`);
}
