'use client'

import { useMutation } from '@tanstack/react-query'
import { APP_EVENT } from '@/analytics/app-events'
import { clearFlowId, setAnalyticsUserId } from '@/analytics/browser-context'
import { reset, track } from '@/analytics/logger'
import { logout } from '@/features/logout/api/logout'

/*
 * 성공하면 서버 세션과 헤더의 서버 렌더 상태를 함께 갱신하기 위해 홈으로 전체 이동한다.
 * 실패하면 실제 쿠키 상태와 화면을 어긋나게 만들지 않도록 이동하지 않는다.
 */
export const useLogout = () => {
  const {
    mutate,
    isPending,
    error,
    reset: resetMutation,
  } = useMutation({
    mutationFn: logout,
    networkMode: 'always',
    onSuccess: () => {
      track(APP_EVENT.logoutComplete)
      reset()
      setAnalyticsUserId(null)
      clearFlowId()
      window.location.assign('/')
    },
  })

  return { logout: mutate, isPending, error, reset: resetMutation }
}
