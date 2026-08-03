import { Suspense } from 'react'
import { ProductListContent } from '@/_pages/product-list/ui/ProductListContent'
import { ProductFiltersSkeleton } from '@/_pages/product-list/ui/ProductFiltersSkeleton'
import { Header } from '@/widgets/header'
import { PageContainer } from '@/shared/ui/PageContainer/PageContainer'
import { ProductGridSkeleton } from '@/widgets/product-card'
import '@/shared/styles/layout.css'

const ProductListFallback = () => (
  <>
    <section className="layout-section">
      <h1>상품 목록</h1>
      <ProductFiltersSkeleton />
    </section>
    <section className="layout-section" aria-label="상품 검색 결과">
      <ProductGridSkeleton />
    </section>
  </>
)

export const ProductListPage = () => (
  <PageContainer>
    <Header />
    <Suspense fallback={<ProductListFallback />}>
      <ProductListContent />
    </Suspense>
  </PageContainer>
)
