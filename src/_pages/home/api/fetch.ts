import { fetchJson } from "@/shared/api";
import type { HomeResponse } from "./types";

export function fetchHome(): Promise<HomeResponse> {
  return fetchJson<HomeResponse>("/api/home");
}
