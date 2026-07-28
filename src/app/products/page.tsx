import { Suspense } from 'react'
import { ProductListContent } from '@/app/products/_components/ProductListContent'
import { Header } from '@/components/ui/header/Header'
import { PageContainer } from '@/components/ui/pageContainer/PageContainer'
import { ProductGridSkeleton } from '@/components/ui/productGrid/ProductGridSkeleton'
import '../../examples/week-05-layout/week-05-layout.css'

const ProductListFallback = () => (
  <>
    <section className="week05-section">
      <h1>상품 목록</h1>
    </section>
    <section className="week05-section" aria-label="상품 검색 결과">
      <ProductGridSkeleton />
    </section>
  </>
)

export default function ProductListPage() {
  return (
    <PageContainer>
      <Header />
      <Suspense fallback={<ProductListFallback />}>
        <ProductListContent />
      </Suspense>
    </PageContainer>
  )
}
