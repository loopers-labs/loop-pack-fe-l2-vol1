import { ProductGridSkeleton } from '@/widgets/product-card'
import { CategorySectionSkeleton } from '@/_pages/home/ui/CategorySectionSkeleton'
import '@/shared/styles/layout.css'

// HomeContent와 같은 배치(카테고리 → 인기/신상품 6개씩)로 높이를 맞춰 layout shift를 막는다.
// Header·h1·Hero는 HomePage가 이 Suspense 바깥에서 소유하므로 여기 넣지 않는다.
export const HomeContentSkeleton = () => (
  <>
    <p role="status" className="visually-hidden">
      홈을 불러오는 중…
    </p>
    <CategorySectionSkeleton />
    {['인기 상품', '신상품'].map((title) => (
      <section className="layout-section" key={title}>
        <h2>{title}</h2>
        <ProductGridSkeleton count={6} />
      </section>
    ))}
  </>
)
