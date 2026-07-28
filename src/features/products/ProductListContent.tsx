import { ProductResultSummary } from "./ProductResultSummary";
import type { ReactNode } from "react";
import { ProductGridSkeleton } from "@/components/commerce/ProductGridSkeleton";
import { Skeleton } from "@/shared/ui/Skeleton";

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
    return (
      <div aria-label="상품을 불러오는 중입니다.">
        <Skeleton className="mb-4 h-5 w-16 rounded-full" />
        <ProductGridSkeleton />
      </div>
    );
  }

  if (error !== null) {
    return (
      <div className="grid gap-3 rounded-gds-md bg-white px-5 py-8 text-sm text-gds-gray-700 shadow-[inset_0_0_0_1px_var(--color-gds-gray-200)]">
        <p>상품 목록을 불러오지 못했습니다.</p>
        <button
          className="w-fit cursor-pointer rounded-gds-sm border border-gds-cta bg-gds-cta px-4 py-2 text-sm font-semibold text-white hover:bg-gds-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gds-green-500"
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
      {isEmpty ? (
        <p className="mt-6 rounded-gds-md bg-white px-5 py-8 text-sm text-gds-gray-700 shadow-[inset_0_0_0_1px_var(--color-gds-gray-200)]">
          조건에 맞는 상품이 없습니다.
        </p>
      ) : (
        children
      )}
    </>
  );
}
