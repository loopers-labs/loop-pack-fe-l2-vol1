import { ProductGrid } from "@/widgets/product-card";
import { Pagination } from "@/shared/ui/pagination";
import type { ProductListResponse } from "@/entities/product";
import layout from "@/shared/ui/layout.module.css";
import styles from "./ProductListResult.module.css";

export function ProductListResult({
  result,
  onPageChange,
}: {
  result: ProductListResponse;
  onPageChange: (page: number) => void;
}) {
  if (result.totalCount === 0) {
    return <p className={layout.status}>검색 결과가 없습니다.</p>;
  }

  const totalPages = Math.ceil(result.totalCount / result.pageSize);

  return (
    <div>
      <p className={styles.resultCount}>총 {result.totalCount}개</p>
      {result.products.length === 0 ? (
        <p className={layout.status}>이 페이지에는 상품이 없습니다.</p>
      ) : (
        <ProductGrid products={result.products} />
      )}
      <Pagination
        page={result.page}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
