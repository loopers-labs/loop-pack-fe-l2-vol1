"use client";

import { Placeholder } from "@/shared/ui/placeholder";
import { ProductCard } from "@/entities/product";
import type { ProductListResponse } from "../api/get-products";
import { ProductCardActions } from "@/widgets/product-card-actions/ui/product-card-actions";

type ProductListResultsProps = {
  result: ProductListResponse;
  page: number;
  onPageChange: (page: number) => void;
};

export function ProductListResults({ result, page, onPageChange }: ProductListResultsProps) {
  const totalPages = Math.max(1, Math.ceil(result.totalCount / result.pageSize));

  return (
    <section className="week05-section" aria-label="상품 검색 결과">
      <p>총 {result.totalCount}개</p>
      {result.totalCount === 0 ? (
        <Placeholder
          title="검색 결과가 없어요"
          description="다른 검색어나 카테고리·정렬을 선택해 보세요."
        />
      ) : result.products.length === 0 ? (
        <Placeholder
          title="존재하지 않는 페이지예요"
          description={`마지막 페이지는 ${totalPages}페이지예요.`}
          action={
            <button type="button" onClick={() => onPageChange(totalPages)}>
              마지막 페이지로 이동
            </button>
          }
        />
      ) : (
        <>
          <div className="week05-grid">
            {result.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                titleAs="h2"
                actions={<ProductCardActions productId={product.id} label={product.name} />}
              />
            ))}
          </div>
          <nav className="week05-pagination" aria-label="페이지 이동">
            <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              이전
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              다음
            </button>
          </nav>
        </>
      )}
    </section>
  );
}
