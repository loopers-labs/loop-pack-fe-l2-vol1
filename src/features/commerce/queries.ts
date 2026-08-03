import { queryOptions } from "@tanstack/react-query";
import type { HomeResponse } from "@/entities/product/model/types";
import { fetchJson } from "@/shared/api";

// 홈은 자주 바뀌지 않는 카탈로그성 데이터 → 오래 신선하게 둔다.
const HOME_STALE_TIME = 5 * 60 * 1000;
const HOME_GC_TIME = 10 * 60 * 1000;

export function homeQueryOptions() {
  return queryOptions({
    queryKey: ["home"],
    queryFn: () => fetchJson<HomeResponse>("/api/home"),
    staleTime: HOME_STALE_TIME,
    gcTime: HOME_GC_TIME,
  });
}
