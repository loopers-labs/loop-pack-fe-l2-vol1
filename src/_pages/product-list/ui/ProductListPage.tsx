import { Suspense } from 'react'
import type { SearchParams } from 'nuqs/server'
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
      <Suspense fallback={<div className="week05-filters" />}>
        <ProductListPrefetch searchParams={searchParams} />
      </Suspense>
    </main>
  )
}
