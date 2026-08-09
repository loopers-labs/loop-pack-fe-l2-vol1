import type { Metadata } from "next";
import { type SearchParams } from "nuqs/server";
import { getQueryClient } from "@/shared/api";
import { productQueries, resolveProductListQuery } from "@/entities/product";
import { loadProductListParams } from "../model/productListParsers";
import { buildProductListMetadata } from "../model/productListMetadata";

// 본문(ProductListSection)과 같은 로더·query factory 를 써서 같은 GET URL 을 만든다 →
// 같은 request 안에서 native fetch 가 memoize 되어 slow Route Handler 를 한 번만 친다.
export async function generateProductListMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const query = resolveProductListQuery(
    await loadProductListParams(searchParams),
  );
  const queryClient = getQueryClient();

  try {
    const result = await queryClient.fetchQuery(productQueries.list(query));

    return buildProductListMetadata(query, result);
  } catch {
    // 조회 실패 시 {} 리턴하여 루트 공통 metadata를 사용하게
    return {};
  }
}
