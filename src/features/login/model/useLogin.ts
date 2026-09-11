'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { APP_EVENT } from '@/analytics/app-events'
import { getFlowId, setAnalyticsUserId } from '@/analytics/browser-context'
import { identify, track } from '@/analytics/logger'
import { sessionQueries } from '@/entities/session'
import { login } from '@/features/login/api/login'

/*
 * 성공 시 세션 캐시만 갱신하고 소유자 동기화는 _app의 단일 책임으로 남긴다.
 * 로그인 401은 자격 증명 오류이므로 전역 만료 처리에서 제외하고, 이벤트 시점에 flow_id를 읽는다.
 */
type UseLoginOptions = {
  returnPath: string
}

const toFlowProperties = () => {
  const flowId = getFlowId()
  return flowId === undefined ? {} : { flow_id: flowId }
}

export const useLogin = ({ returnPath }: UseLoginOptions) => {
  const queryClient = useQueryClient()

  const { mutate, isPending, error } = useMutation({
    mutationFn: login,
    networkMode: 'always',
    onSuccess: ({ user }) => {
      setAnalyticsUserId(user.id)
      identify(user.id)
      track(APP_EVENT.loginSuccess, toFlowProperties())
      queryClient.setQueryData(sessionQueries.me().queryKey, user)
      /* 서버 세션과 헤더를 함께 갱신하고 로그인 화면이 히스토리에 남지 않도록 전체 이동한다. */
      window.location.replace(returnPath)
    },
    onError: () => {
      track(APP_EVENT.loginFail, toFlowProperties())
    },
  })

  return { login: mutate, isPending, error }
}
