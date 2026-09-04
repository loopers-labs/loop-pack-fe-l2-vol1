import { WishlistContent } from '@/_pages/wishlist/ui/WishlistContent'
import { isWishlistEntryPoint } from '@/analytics/app-events'
import { Header } from '@/widgets/header'
import { PageContainer } from '@/shared/ui/PageContainer/PageContainer'
import '@/shared/styles/layout.css'

// h1은 Client 경계 밖에 둔다. 목록·홈과 같은 이유로 페이지가 소유한다.
type WishlistPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const WishlistPage = async ({ searchParams }: WishlistPageProps) => {
  const params = await searchParams
  const entryPoint = isWishlistEntryPoint(params.entryPoint) ? params.entryPoint : 'direct'

  return (
    <PageContainer>
      <Header />
      <section className="layout-section">
        <h1>위시리스트</h1>
        <WishlistContent entryPoint={entryPoint} />
      </section>
    </PageContainer>
  )
}
