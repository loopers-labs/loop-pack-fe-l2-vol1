import { Suspense } from 'react'
import { MyProfile } from '@/_pages/mypage/ui/MyProfile'
import { Header } from '@/widgets/header'
import { PageContainer } from '@/shared/ui/PageContainer/PageContainer'
import '@/shared/styles/layout.css'

export const MyPage = () => (
  <PageContainer>
    <Header />
    <section className="layout-section">
      <h1>마이페이지</h1>
      {/* /api/auth/me는 mock이 매 호출 500ms를 잡는다. Header와 h1이 그것을 기다리지 않게 한다. */}
      <Suspense fallback={<p>내 정보를 불러오는 중입니다.</p>}>
        <MyProfile />
      </Suspense>
    </section>
  </PageContainer>
)
