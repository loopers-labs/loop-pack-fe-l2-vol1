import { ProductGrid } from "./ProductGrid";
import { Pagination } from "./Pagination";
import type { ProductListResponse } from "@/types/commerce";
import styles from "./commerce.module.css";

export function ProductListResult({
  result,
  onPageChange,
}: {
  result: ProductListResponse;
  onPageChange: (page: number) => void;
}) {
  if (result.totalCount === 0) {
    return <p className={styles.status}>검색 결과가 없습니다.</p>;
  }

  const totalPages = Math.ceil(result.totalCount / result.pageSize);

  return (
    <div>
      <p className={styles.resultCount}>총 {result.totalCount}개</p>
      {result.products.length === 0 ? (
        <p className={styles.status}>이 페이지에는 상품이 없습니다.</p>
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
