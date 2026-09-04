'use client'

import { useMutation } from '@tanstack/react-query'
import { APP_EVENT } from '@/analytics/app-events'
import { clearFlowId, setAnalyticsUserId } from '@/analytics/browser-context'
import { reset, track } from '@/analytics/logger'
import { logout } from '@/features/logout/api/logout'

// 성공하면 홈으로 전체 이동한다. router.push가 아닌 이유는 로그인 상태가 서버 렌더에 들어 있기
// 때문이다 — 헤더가 세션을 서버에서 읽으므로(docs/week-09/decisions.md 6번) 클라이언트 캐시만
// 비우면 이미 그려진 이름이 그대로 남는다.
//
// router.refresh()와 세션 캐시 무효화를 함께 부르면 SPA로도 되지만, 맞춰야 할 자리가 둘이 된다.
// 로그아웃은 남은 상태를 버리는 동작이라 통째로 다시 받는 쪽이 맞다고 봤다.
//
// 실패하면 이동하지 않는다. 쿠키가 안 지워졌는데 로그아웃된 화면을 보여주면 안 되고,
// 그대로 머무는 것이 실제 상태와 맞다. 사유는 버튼이 인라인으로 보여준다.
export const useLogout = () => {
  const { mutate, isPending, error } = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      track(APP_EVENT.logoutComplete)
      reset()
      setAnalyticsUserId(null)
      clearFlowId()
      window.location.assign('/')
    },
  })

  return { logout: mutate, isPending, error }
}
