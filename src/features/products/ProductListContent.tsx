import { ProductResultSummary } from "./ProductResultSummary";
import type { ReactNode } from "react";

type ProductListContentProps = {
  isLoading: boolean;
  error: Error | null;
  isEmpty: boolean;
  totalCount: number;
  onRetry: () => void;
  children: ReactNode;
};

export function ProductListContent({
  isLoading,
  error,
  isEmpty,
  totalCount,
  onRetry,
  children,
}: ProductListContentProps) {
  if (isLoading) {
    return <p>상품을 불러오는 중입니다.</p>;
  }

  if (error !== null) {
    return (
      <div className="grid gap-3">
        <p>상품 목록을 불러오지 못했습니다.</p>
        <button
          className="w-fit border border-[#c8c8c8] bg-transparent px-3 py-2 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#2557a7]"
          type="button"
          onClick={onRetry}
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <>
      <ProductResultSummary totalCount={totalCount} />
      {isEmpty ? <p className="mt-6">조건에 맞는 상품이 없습니다.</p> : children}
    </>
  );
}
