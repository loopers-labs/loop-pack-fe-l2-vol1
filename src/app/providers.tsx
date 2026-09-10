'use client'

import { useRef, useState } from 'react'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import {
  expiredLoginPathFor,
  isSessionExpiredError,
} from '@/entities/session/model/sessionExpiry'
import { isExpectedFailure, isRetryable } from '@/shared/api/http'

interface ProvidersProps {
  children: React.ReactNode
}

export const MAX_QUERY_RETRIES = 1

export const createBrowserQueryClient = (onSessionExpired?: () => void) =>
  new QueryClient({
    // 세션 만료를 다루는 자리는 여기 하나다. 화면마다 401을 해석하면 어떤 화면은
    // 안내하고 어떤 화면은 빈 목록을 보여주게 되고, 고칠 곳도 그만큼 흩어진다.
    //
    // QueryCache에 등록해 "조회 요청의 401만 만료로 본다"는 기준을 구조적으로 적용한다.
    // 로그인 요청은 mutation이라 이 콜백을 지나가지 않는다(entities/session의 판정 근거).
    queryCache: new QueryCache({
      onError: (error) => {
        if (isSessionExpiredError(error)) onSessionExpired?.()
      },
    }),
    defaultOptions: {
      // 정책이 없는 새 쿼리도 한 화면 안의 중복 요청은 피한다.
      // 도메인별 팩토리에서는 더 구체적인 staleTime을 적용한다.
      queries: {
        // 400대는 같은 요청을 다시 보내도 결과가 같다. 자동 재시도는 사용자가 기다리는
        // 시간만 늘린다. 서버 오류, 네트워크 실패, 타임아웃에만 한 번 더 시도한다.
        retry: (failureCount, error) =>
          isRetryable(error) && failureCount < MAX_QUERY_RETRIES,
        // 전파 기준은 status가 아니라 "화면이 설명할 수 있는 실패인가"다.
        // 예측한 조회 실패는 화면이 인라인으로 다룬다. 필터를 남긴 채 조건을 바꿔
        // 벗어날 수 있어야 하기 때문이다. 예상 밖 오류는 화면이 복구 방법을 모르므로
        // 가장 가까운 Error Boundary로 올린다. 근거는 RFC Decision 6에 있다.
        throwOnError: (error) => !isExpectedFailure(error),
        staleTime: 20_000,
      },
    },
  })

export default function Providers({ children }: ProvidersProps) {
  // 만료 이동은 한 번만 한다. 한 화면에서 쿼리 여러 개가 동시에 401을 받아도 이동은 1회다.
  const redirected = useRef(false)

  // QueryClient를 Provider 최초 렌더에 한 번만 만든다.
  // 본문에서 생성하면 리렌더마다 새 인스턴스가 되어 캐시가 초기화된다.
  // 서버 prefetch를 추가하면 요청마다 새로 만들어야 한다.
  // 모듈 스코프에 하나를 두면 요청 사이로 캐시가 샌다.
  //
  // 만료 콜백은 여기서 바로 넘긴다. effect에서 설치하면 첫 렌더에 나간 쿼리의 401을 놓친다.
  const [queryClient] = useState(() =>
    createBrowserQueryClient(() => {
      if (redirected.current) return
      redirected.current = true

      // 문서 이동을 한 번 수행한다. 클라이언트 이동과 갱신을 함께 호출하면 두 요청이 경합하고,
      // 문서를 다시 받으면 서버 layout과 헤더도 새 세션 상태로 렌더된다.
      //
      // 경로는 usePathname/useSearchParams가 아니라 window에서 읽는다. Providers는
      // root layout에 있어 모든 라우트를 감싸므로, 훅을 쓰면 정적 생성 대상까지
      // 클라이언트 렌더링 대상이 된다. 이 콜백은 브라우저에서만 실행된다.
      const { pathname, search } = window.location
      window.location.replace(expiredLoginPathFor(`${pathname}${search}`))
    }),
  )

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </NuqsAdapter>
  )
}
