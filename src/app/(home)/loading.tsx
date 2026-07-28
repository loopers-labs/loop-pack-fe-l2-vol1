import { PageContainer } from '@/components/ui/pageContainer/PageContainer'

// useSuspenseHomeQuery가 홈 데이터를 기다리는 동안 App Router가 자동으로 보여주는 스켈레톤이다.
// useQuery + 본문 isLoading 분기 대신 Suspense 경계로 로딩 UI를 컴포넌트 밖으로 분리하기로 해서 추가했다.
const HomeLoading = () => (
  <PageContainer>
    <p role="status">홈을 불러오는 중…</p>
  </PageContainer>
)

export default HomeLoading
