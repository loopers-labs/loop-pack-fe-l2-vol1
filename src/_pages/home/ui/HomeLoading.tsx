import { Header } from '@/widgets/header'
import { PageContainer } from '@/shared/ui/PageContainer/PageContainer'
import { ProductGridSkeleton } from '@/widgets/product-card'
import { HeroBannerSkeleton } from '@/_pages/home/ui/HeroBannerSkeleton'
import { CategorySectionSkeleton } from '@/_pages/home/ui/CategorySectionSkeleton'
import styles from './HomeLoading.module.css'
import '@/shared/styles/layout.css'

// useSuspenseHomeQuery가 홈 데이터를 기다리는 동안 App Router가 자동으로 보여주는 스켈레톤이다.
// HomeContent와 같은 배치(배너 → 카테고리 → 인기/신상품 6개씩)로 높이를 맞춰 layout shift를 막는다.
export const HomeLoading = () => (
  <PageContainer>
    <p role="status" className={styles.visuallyHidden}>
      홈을 불러오는 중…
    </p>
    <Header />
    <HeroBannerSkeleton />
    <CategorySectionSkeleton />
    {['인기 상품', '신상품'].map((title) => (
      <section className="layout-section" key={title}>
        <h2>{title}</h2>
        <ProductGridSkeleton count={6} />
      </section>
    ))}
  </PageContainer>
)
