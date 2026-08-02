import { Suspense } from 'react'
import { ProductListView } from '@/_pages/product-list'

// 라우팅 진입점이다. 화면 조합은 페이지 슬라이스가 소유한다.
// 이 Suspense는 데이터 로딩 경계가 아니다. useQueryStates가 useSearchParams 기반이라
// 프리렌더 시점에 경계를 요구한다. 조회 로딩은 화면 안에서 isPending으로 처리한다.
export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="week05-section">
          <p>Loading products…</p>
        </main>
      }
    >
      <ProductListView />
    </Suspense>
  )
}
