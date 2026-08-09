import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing'
import { useProductListCondition } from './useProductListCondition'

// URL 조건이 요청 조건으로 조립되는 자리다. 여기서 검증하는 것은 두 가지다.
// 재현 조건이 요청까지 내려가는가, 그리고 필터 초기화가 재현 조건을 지우지 않는가.
// 초기화가 재현 조건을 지우면 측정 도중 화면이 조용히 평소 응답으로 돌아간다.

function ConditionProbe() {
  const { condition, setFilters, canResetFilters } = useProductListCondition()

  return (
    <div>
      <p data-testid="scenario">{String(condition.scenario)}</p>
      <p data-testid="category">{condition.category}</p>
      <p data-testid="can-reset">{String(canResetFilters)}</p>
      <button type="button" onClick={() => setFilters(null)}>
        reset
      </button>
    </div>
  )
}

const renderProbe = (searchParams: string, onUrlUpdate?: () => void) =>
  render(
    <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate}>
      <ConditionProbe />
    </NuqsTestingAdapter>,
  )

describe('useProductListCondition', () => {
  it('URL의 재현 조건을 요청 조건으로 넘긴다', () => {
    renderProbe('?scenario=slow&category=goods')

    expect(screen.getByTestId('scenario')).toHaveTextContent('slow')
    expect(screen.getByTestId('category')).toHaveTextContent('goods')
  })

  it('지원하지 않는 재현 조건은 요청 조건으로 쓰지 않는다', () => {
    renderProbe('?scenario=xxx')

    expect(screen.getByTestId('scenario')).toHaveTextContent('null')
  })

  it('재현 조건만 있으면 초기화할 필터가 없다', () => {
    renderProbe('?scenario=slow')

    expect(screen.getByTestId('can-reset')).toHaveTextContent('false')
  })

  it('필터를 초기화해도 재현 조건은 URL에 남는다', async () => {
    const onUrlUpdate = vi.fn()
    renderProbe('?scenario=slow&category=goods&sort=price-asc', onUrlUpdate)

    fireEvent.click(screen.getByRole('button', { name: 'reset' }))

    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled())
    const updated = onUrlUpdate.mock.calls.at(-1)?.[0] as UrlUpdateEvent
    expect(updated.searchParams.get('category')).toBeNull()
    expect(updated.searchParams.get('sort')).toBeNull()
    expect(updated.searchParams.get('scenario')).toBe('slow')
  })
})
