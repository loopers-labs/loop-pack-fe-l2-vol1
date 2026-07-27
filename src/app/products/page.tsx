import { Suspense } from 'react'
import ProductListView from './ProductListView'

// useQueryStates는 useSearchParams 기반이라 프리렌더 시 Suspense 경계가 필요하다.
export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <main className="week05-section">
          <p>상품 목록을 불러오는 중입니다.</p>
        </main>
      }
    >
      <ProductListView />
    </Suspense>
  )
}
