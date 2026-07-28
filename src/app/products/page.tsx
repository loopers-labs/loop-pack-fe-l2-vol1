import { Suspense } from "react";
import { type SearchParams } from "nuqs/server";
import { ProductListSection } from "./ProductListSection";
import styles from "@/components/commerce/commerce.module.css";

export default function ProductListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    // 스트리밍 경계 — 목록 prefetch(ProductListSection 의 await)를 여기서 잡아 HTML 껍데기를 먼저 내려주기 위해 Suspense사용.
    // (CSR bailout 격리와는 무관: 이 라우트가 정적 프리렌더될 때 useSearchParams 를 감싸주는 건
    //  layout 의 Suspense 쪽이고, 이 경계를 지워도 빌드 에러는 나지 않는다 — 대신 prefetch(await)가
    //  끝날 때까지 첫 응답이 통째로 지연된다(TTFB).)
    <Suspense
      fallback={<p className={styles.status}>상품 목록을 불러오는 중…</p>}
    >
      <ProductListSection searchParams={searchParams} />
    </Suspense>
  );
}
