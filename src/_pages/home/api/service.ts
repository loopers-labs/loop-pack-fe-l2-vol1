import { useSuspenseQuery } from '@tanstack/react-query'
import { homeQueries } from './queries'

// 로딩은 HomePage의 Suspense 경계, 에러는 error.tsx(ErrorBoundary)에 맡기려고 useSuspenseQuery를 쓴다.
// 라우트 레벨 loading.tsx는 두지 않는다 — 이 Suspense와 중복이라 초기 HTML에 Header·h1이 두 벌 실렸다.
// data가 항상 확정이라 소비 컴포넌트에서 undefined 가드가 필요 없다.
export const useSuspenseHomeQuery = () => useSuspenseQuery(homeQueries.detail())
