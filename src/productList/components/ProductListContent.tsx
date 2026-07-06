import type { ReactNode } from "react";
import { ProductListError } from "./ProductListError";
import { ProductListLoading } from "./ProductListLoading";

type ProductListContentProps = {
  isInitialLoading: boolean;
  isEmpty: boolean;
  error: Error | null;
  onRetry: () => void;
  children: ReactNode;
};

export function ProductListContent({
  isInitialLoading,
  isEmpty,
  error,
  onRetry,
  children,
}: ProductListContentProps) {
  if (isInitialLoading) {
    return <ProductListLoading />;
  }

  if (error) {
    return <ProductListError message={error.message} onRetry={onRetry} />;
  }

  if (isEmpty) {
    return <div className="empty">조건에 맞는 상품이 없습니다.</div>;
  }

  return <>{children}</>;
}
