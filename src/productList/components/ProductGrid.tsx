import type { ReactNode } from "react";
import type { ViewMode } from "../types";

/** 상품 카드들을 그리드/리스트로 배치하는 셸. 비어 있으면 안내 문구를 보여준다. */
export default function ProductGrid({
  viewMode,
  isEmpty,
  children,
}: {
  viewMode: ViewMode;
  isEmpty: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className="product-grid"
      style={viewMode === "list" ? { gridTemplateColumns: "1fr" } : undefined}
    >
      {isEmpty ? (
        <div className="empty">조건에 맞는 상품이 없습니다.</div>
      ) : (
        children
      )}
    </section>
  );
}
