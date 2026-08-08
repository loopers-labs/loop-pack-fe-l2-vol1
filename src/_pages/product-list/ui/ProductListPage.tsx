import { Suspense } from 'react'
import type { SearchParams } from 'nuqs/server'
import ProductListPending from './ProductListPending'
import ProductListPrefetch from './ProductListPrefetch'

interface ProductListPageProps {
  searchParams: Promise<SearchParams>
}

// 목록의 서버 셸이다. 조회와 무관한 제목과 설명만 담아 먼저 전송한다.
// searchParams를 여기서 기다리지 않는다. URL 파싱만으로 셸까지 늦어진다.
export default function ProductListPage({
  searchParams,
}: ProductListPageProps) {
  return (
    <main>
      <section className="product-list-hero">
        <p className="product-list-eyebrow">SHOP</p>
        <h1>Products</h1>
        <p className="product-list-description">
          Objects worth keeping, selected for everyday life.
        </p>
      </section>
      {/* fallback이 결과가 들어올 자리를 실제 크기로 잡는다. 빈 div를 두면 조회가
          끝날 때까지 제목 아래가 비어 있다. */}
      <Suspense fallback={<ProductListPending />}>
        <ProductListPrefetch searchParams={searchParams} />
      </Suspense>
    </main>
  )
}
