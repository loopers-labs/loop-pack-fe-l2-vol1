'use client'

import { useQuery } from '@tanstack/react-query'
import { sessionQueries } from '@/entities/session/api/queries'

export const useSessionQuery = () => useQuery(sessionQueries.me())

// 장바구니·위시리스트가 "누구의 목록인가"를 판단할 때 쓰는 값.
// 세션 전용 store를 두지 않고 Query 캐시를 그 자리로 쓴다 — QueryClientProvider가 이미
// _app에 있어서, 어느 레이어에서 불러도 같은 값을 본다(docs/week-09/decisions.md 7번).
export const useCurrentUserId = (): string | null => useSessionQuery().data?.id ?? null
