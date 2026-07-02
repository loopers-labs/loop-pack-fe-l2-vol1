import type { ReactNode } from "react";

/** 필터 섹션들을 배치하고 초기화 버튼을 붙이는 패널 셸. */
export default function FilterPanel({
  children,
  onReset,
}: {
  children: ReactNode;
  onReset: () => void;
}) {
  return (
    <section className="filter-panel">
      {children}

      <button className="reset-button" onClick={onReset}>
        필터 초기화
      </button>
    </section>
  );
}
