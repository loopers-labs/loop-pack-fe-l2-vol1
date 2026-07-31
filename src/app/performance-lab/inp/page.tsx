import type { Metadata } from "next";
import { createAdvancedAProducts } from "./_data/advanced-a-products";
import { AdvancedAProductList } from "./_components/advanced-a-product-list";
import styles from "./performance-lab.module.css";
import { resolveAdvancedAPageSize } from "./page-size";

export const metadata: Metadata = {
  title: "Advanced A · INP Performance Lab",
  description:
    "24개 상품 카드의 찜 상호작용과 렌더 범위를 재현하는 Week 7 성능 실험실",
};

type AdvancedAPageProps = {
  searchParams: Promise<{
    pageSize?: string | string[];
  }>;
};

export default async function AdvancedAPage({
  searchParams,
}: AdvancedAPageProps) {
  const params = await searchParams;
  const requestedPageSize = Array.isArray(params.pageSize)
    ? params.pageSize[0]
    : params.pageSize;
  const pageSize = resolveAdvancedAPageSize(requestedPageSize);
  const products = createAdvancedAProducts();

  return (
    <main
      className={styles.lab}
      data-week07-advanced-a=""
      data-week07-page-size={pageSize}
    >
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Week 07 · Advanced A · Starter</p>
          <h1>
            Click one heart.
            <span>Watch the render field.</span>
          </h1>
          <p className={styles.lede}>
            찜 하나가 만드는 상호작용 구간과 카드 렌더 범위를 같은 조건에서
            측정하세요. starter는 재현 조건만 제공하며 최적화 구현은 비워
            둡니다.
          </p>
        </div>

        <aside aria-label="고정 측정 조건" className={styles.protocol}>
          <p className={styles.protocolLabel}>Fixed protocol</p>
          <dl>
            <div>
              <dt>Cards</dt>
              <dd>{pageSize}</dd>
            </div>
            <div>
              <dt>CPU</dt>
              <dd>4×</dd>
            </div>
            <div>
              <dt>Runs</dt>
              <dd>3 + 3</dd>
            </div>
          </dl>
          <div aria-hidden="true" className={styles.traceLine}>
            <span />
          </div>
        </aside>
      </header>

      <section aria-label="실험 절차" className={styles.instructions}>
        <p>
          <strong>01</strong> production build에서 이미지 로딩을 기다려요.
        </p>
        <p>
          <strong>02</strong> Performance 기록을 시작해요.
        </p>
        <p>
          <strong>03</strong> 같은 상품의 하트를 한 번 눌러요.
        </p>
        <p>
          <strong>04</strong> profiling build에서 렌더 원인을 연결해요.
        </p>
      </section>

      <AdvancedAProductList products={products} />
    </main>
  );
}
