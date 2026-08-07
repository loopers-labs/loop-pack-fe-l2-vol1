import { Suspense } from 'react'
import { ProductListContent } from '@/_pages/product-list/ui/ProductListContent'
import { ProductFiltersSkeleton } from '@/_pages/product-list/ui/ProductFiltersSkeleton'
import { Header } from '@/widgets/header'
import { PageContainer } from '@/shared/ui/PageContainer/PageContainer'
import { ProductGridSkeleton } from '@/widgets/product-card'
import '@/shared/styles/layout.css'

const ProductListFallback = () => (
  <>
    <ProductFiltersSkeleton />
    <section className="layout-section" aria-label="상품 검색 결과">
      <ProductGridSkeleton />
    </section>
  </>
)

// h1은 Suspense 경계 밖에 둔다. fallback과 본문이 각각 h1을 가지면 스트리밍 문서에 두 벌이 실려
// JS를 실행하지 않는 크롤러와 JS 비활성 화면에서 "하나의 명확한 h1"이 깨진다.
// (DOM에서는 React가 fallback을 걷어내 하나만 남으므로 브라우저로는 보이지 않는 결함이다.)
// 홈도 같은 이유로 h1을 HomePage가 소유한다.
//
// 검색 결과 section을 이 section 안에 중첩한 것은 간격을 그대로 유지하기 위해서다.
// layout.css의 `.layout-section > h1`(margin-bottom 16px)과 `.layout-section`(margin-top 40px)이
// 옮기기 전과 같은 순서로 걸린다.
export const ProductListPage = () => (
  <PageContainer>
    <Header />
    <section className="layout-section">
      <h1>상품 목록</h1>
      <Suspense fallback={<ProductListFallback />}>
        <ProductListContent />
      </Suspense>
    </section>
  </PageContainer>
)
