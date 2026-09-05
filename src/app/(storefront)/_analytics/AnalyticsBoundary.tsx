'use client'

import { useEffect } from 'react'
import { consoleProvider } from '@/analytics/consoleProvider'
import { commonProperties } from '@/analytics/context'
import { identifyUser, resetUser } from '@/analytics/events'
import {
  initAnalytics,
  registerProviders,
  setCommonProperties,
} from '@/analytics/logger'
import type { SessionUser } from '@/entities/session/model/session'

// 계측을 켜는 자리다. (storefront) 그룹에만 둔다. 데모 라우트((lab) 그룹)의 클릭이
// 사용자 행동 로그에 섞이면, 3단계에서 그 로그로 세우는 순위가 우리 손으로 오염된다.
//
// 초기화가 늦어도 이벤트는 잃지 않는다. track() 은 초기화 전에 불리면 큐에 담겼다가
// 초기화 후 순서대로 나간다(스타터 logger 계약). 그래서 목록 진입처럼 첫 렌더에
// 발생하는 이벤트를 이 컴포넌트보다 먼저 불러도 된다.
export default function AnalyticsBoundary({
  user,
}: {
  user: SessionUser | null
}) {
  useEffect(() => {
    registerProviders([consoleProvider])
    setCommonProperties(commonProperties)
    void initAnalytics()
  }, [])

  // 서버가 읽은 세션을 그대로 따라간다. 로그인·로그아웃 직후 router.refresh() 로
  // 이 값이 바뀌므로, identify 와 reset 을 각 화면에 흩어 두지 않아도 된다.
  useEffect(() => {
    if (user === null) resetUser()
    else identifyUser(user.id)
  }, [user])

  return null
}
