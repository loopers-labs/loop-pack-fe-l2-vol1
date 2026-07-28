import { Suspense, type ReactNode } from "react";
import { CommerceHeader } from "@/components/commerce/CommerceHeader";
import { ProductListFilters } from "@/components/commerce/ProductListFilters";
import styles from "@/components/commerce/commerce.module.css";

// 목록 조회 실패 시 error.tsx 는 이 layout 안(= {children} 자리)에서 렌더된다 →
// 헤더·검색/정렬 필터는 경계 바깥이라 그대로 유지되고, 목록 자리만 에러 화면으로 교체된다.
export default function ProductListLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className={styles.page}>
      <CommerceHeader />
      <section className={styles.section}>
        <h1 className={styles.sectionTitle}>상품 목록</h1>
        {/* nuqs(useSearchParams)에서 생기는 CSR bailout 격리
            https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout */}
        <Suspense fallback={null}>
          <ProductListFilters />
        </Suspense>
        {children}
      </section>
    </main>
  );
}
