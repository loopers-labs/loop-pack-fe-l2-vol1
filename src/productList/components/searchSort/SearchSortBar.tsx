import type { ReactNode } from "react";

/** 검색·정렬·보기 컨트롤을 가로로 배치하는 상단 바 셸. */
export default function SearchSortBar({ children }: { children: ReactNode }) {
  return <section className="search-sort">{children}</section>;
}
