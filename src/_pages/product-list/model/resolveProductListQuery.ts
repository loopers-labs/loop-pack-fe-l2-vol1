import { isCategoryValue, isSortValue } from "../config/options";
import type { ResolvedProductListQuery } from "./useProductListQuery";

// 서버(generateMetadata·prefetch)에서 URL 조건을 읽는 경로.
// nuqs 파서와 같은 기본값·같은 좁히기를 쓴다 — 여기가 어긋나면 metadata와 본문이
// 서로 다른 GET URL을 만들고, hydration 직후 목록이 한 번 더 요청된다.
export function resolveProductListQuery(
  searchParams: Record<string, string | string[] | undefined>,
): ResolvedProductListQuery {
  const first = (value: string | string[] | undefined): string | undefined =>
    Array.isArray(value) ? value[0] : value;

  const q = first(searchParams.q) ?? "";
  const category = first(searchParams.category);
  const sort = first(searchParams.sort);
  const page = Number(first(searchParams.page) ?? "1");

  return {
    q,
    category: category !== undefined && isCategoryValue(category) ? category : "all",
    sort: sort !== undefined && isSortValue(sort) ? sort : "latest",
    page: Number.isSafeInteger(page) && page >= 1 ? page : 1,
  };
}
