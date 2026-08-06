"use client";

import { useQuery } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";

import { productListQueryOptions } from "@/features/products/api/queries";
import { productSearchParsers } from "@/features/products/model/searchParams";
import { ProductGridSkeleton } from "@/features/products/ui/ProductSkeleton";
import { ProductCard } from "@/widgets/product-card/ui/ProductCard";

// 목록의 로딩·에러·빈·성공 상태를 그린다. 실패 케이스를 먼저 걸러내고 목록을 마지막에 그린다.
// 조회 조건도 결과도 스스로 읽는다. 부모와 같은 query key라 캐시를 공유해 요청은 한 번만 나간다.
export function ProductListResults() {
  const [query] = useQueryStates(productSearchParsers);
  const { data, isPending, isError, error, isFetching, refetch } = useQuery(
    productListQueryOptions(query),
  );

  // 아직 아무 데이터도 없는 첫 로딩.
  if (isPending) {
    return <ProductGridSkeleton count={query.pageSize} />;
  }

  // 첫 조회가 실패해 보여줄 데이터가 없다(4xx·네트워크. 5xx는 throwOnError로 경계에서 처리).
  if (!data) {
    return <p role="alert">{error?.message ?? "상품을 불러오지 못했어요."}</p>;
  }

  // 조건에 맞는 상품이 없다. 마지막 페이지를 넘는 경우는 서버 page.tsx가 redirect로 이미 정정하므로,
  // 여기서 빈 목록은 진짜 결과 없음이다.
  if (data.products.length === 0) {
    return <p>조건에 맞는 상품이 없습니다.</p>;
  }

  // 보여줄 목록이 있다(성공, 또는 배경 재조회 실패로 직전 목록 유지).
  // data 우선이라 배경 재조회가 실패해도 목록을 덮지 않고 배너로만 알린다.
  return (
    <>
      {isError && (
        <p role="alert">
          최신 목록을 불러오지 못했어요.{" "}
          <button type="button" onClick={() => refetch()} disabled={isFetching}>
            다시 시도
          </button>
        </p>
      )}
      <p>총 {data.totalCount}개</p>
      <div className="week05-grid">
        {/* key에 위치(index)를 함께 넣는다. 전환(특히 all↔카테고리)에서 양쪽에 겹치는 상품이
            product.id만으로는 DOM이 유지된 채 자리를 옮겨 CLS가 생긴다. index를 더하면 위치가 바뀔 때
            key가 달라져 그 자리에 새로 mount되므로 이동이 없다. product.id를 남겨 같은 위치의 서로
            다른 상품은 구분된다. 목록은 조건마다 통째로 교체되고 카드는 상태가 없어 안전하다. */}
        {data.products.map((product, index) => (
          <ProductCard key={`${product.id}-${index}`} product={product} />
        ))}
      </div>
    </>
  );
}
