'use client'

import { useSuspenseHomeQuery } from '@/service/home/service'
import { HeroBanner } from '@/components/ui/banner/HeroBanner'
import { CategorySection } from '@/components/ui/categorySection/CategorySection'
import { Header } from '@/components/ui/header/Header'
import { PageContainer } from '@/components/ui/pageContainer/PageContainer'
import { ProductGrid } from '@/components/ui/productGrid/ProductGrid'

// useQuery 대신 useSuspenseQuery를 쓴 이유:
// - useQuery는 data가 로딩·에러 중 undefined라 본문마다 `!data` 가드가 필요했다.
// - useSuspenseQuery는 data가 항상 확정 → 본문이 데이터 렌더링에만 집중한다.
// - 로딩은 loading.tsx(Suspense 경계), 에러는 error.tsx(ErrorBoundary)가 선언적으로 처리한다.
// 서버에서 prefetch한 캐시를 HydrationBoundary로 넘겨받으므로, 이 훅은 보통 재요청 없이 확정 데이터를 읽는다.
// 단, 빈 상태(scenario=empty)는 에러도 로딩도 아닌 정상 응답이라 Suspense가 잡지 않는다.
// 홈의 인기/신상품은 사용자가 조회한 결과가 아니라 시스템이 큐레이션한 섹션이므로,
// 비면 "없음" 메시지 대신 섹션째 미노출한다(빈 레일을 숨기는 이커머스 홈의 일반 관행).
export const HomeContent = () => {
  const { data } = useSuspenseHomeQuery()
  const { banner, categories, popularProducts, newProducts } = data

  const productSections = [
    { title: '인기 상품', products: popularProducts },
    { title: '신상품', products: newProducts },
  ].filter(({ products }) => products.length > 0)

  return (
    <PageContainer>
      <Header />
      <HeroBanner banner={banner} />
      <CategorySection categories={categories} />
      {productSections.map(({ title, products }) => (
        <section className="week05-section" key={title}>
          <h2>{title}</h2>
          <ProductGrid products={products} titleLevel={3} />
        </section>
      ))}
    </PageContainer>
  )
}
