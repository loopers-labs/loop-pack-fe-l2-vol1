import { useSuspenseQuery } from '@tanstack/react-query'
import { homeQueries } from '@/service/home/queries'

// 로딩은 loading.tsx(Suspense 경계), 에러는 error.tsx(ErrorBoundary)에 맡기려고 useSuspenseQuery를 쓴다.
// data가 항상 확정이라 소비 컴포넌트에서 undefined 가드가 필요 없다.
export const useSuspenseHomeQuery = () => useSuspenseQuery(homeQueries.detail())
