import { act, renderHook } from '@testing-library/react'
import { useQueryStates } from 'nuqs'
import { NuqsTestingAdapter, type OnUrlUpdateFunction } from 'nuqs/adapters/testing'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { productListParsers } from './search-params'
import { useProductFilters } from './useProductFilters'

const SEARCH_DEBOUNCE_DELAY = 300
const URL_QUEUE_SETTLE_DELAY = 100

// nuqs는 URL 갱신을 자체 큐에 모았다가 흘려보낸다. 큐가 비워질 시간을 따로 준다.
const settleUrlQueue = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(URL_QUEUE_SETTLE_DELAY)
  })
}

// 디바운스 타이머를 동기로 넘겨 예약된 갱신을 발화시킨 뒤 큐를 비운다.
const flushDebounceAndUrlQueue = async () => {
  act(() => {
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_DELAY)
  })
  await settleUrlQueue()
}

// 훅과 함께 URL을 직접 바꿀 setter를 꺼내 둔다.
// 뒤로·앞으로 이동처럼 훅 바깥에서 q가 바뀌는 상황을 이 setter로 만든다.
const renderProductFilters = (searchParams?: string) => {
  const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
  const { result } = renderHook(
    () => ({
      filters: useProductFilters(),
      setSearchParams: useQueryStates(productListParsers)[1],
    }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate} hasMemory>
          {children}
        </NuqsTestingAdapter>
      ),
    },
  )

  return {
    result,
    updatedQueryStrings: () => onUrlUpdate.mock.calls.map(([event]) => event.queryString),
  }
}

// 계획서 13번 (RTL 쪽 — 디바운스 취소) — docs/rfc/week08-test-plan.md
describe('useProductFilters 검색어 debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('입력 후 300ms가 지나면 검색어를 반영하고 첫 페이지로 이동한다', async () => {
    const { result, updatedQueryStrings } = renderProductFilters('?page=3')

    act(() => result.current.filters.setQuery('셔츠'))
    await flushDebounceAndUrlQueue()

    // page는 기본값 1로 돌아가 URL에서 사라진다.
    expect(updatedQueryStrings()).toEqual(['?q=셔츠'])
  })

  it('대기 중 URL 검색어가 바뀌면 이전 입력을 반영하지 않는다', async () => {
    const { result, updatedQueryStrings } = renderProductFilters()

    act(() => result.current.filters.setQuery('이전 검색어'))
    // 뒤로 가기처럼 URL이 먼저 바뀌고, 그 다음에 예약된 디바운스가 발화한다.
    act(() => void result.current.setSearchParams({ q: '복원된 검색어' }))
    await settleUrlQueue()
    await flushDebounceAndUrlQueue()

    expect(result.current.filters.q).toBe('복원된 검색어')
    expect(updatedQueryStrings()).toEqual(['?q=복원된+검색어'])
  })
})
