import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ErrorBoundaryFallback from './error'

// Next의 route 경계에 이 컴포넌트가 실제로 걸리는지는 여기서 검증하지 못한다.
// 그것은 수동 확인 항목으로 남기고, 여기서는 fallback이 무엇을 보여주고
// reset이 어디에 연결되는지를 고정한다.

describe('루트 error 경계의 fallback', () => {
  it('원인 메시지와 두 출구를 보여준다', () => {
    render(
      <ErrorBoundaryFallback
        error={new Error('상품 목록을 그리지 못했습니다')}
        reset={vi.fn()}
      />,
    )

    expect(
      screen.getByText('상품 목록을 그리지 못했습니다'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '홈으로' })).toHaveAttribute(
      'href',
      '/',
    )
  })

  it('다시 시도가 reset을 부른다', () => {
    const reset = vi.fn()
    render(<ErrorBoundaryFallback error={new Error('실패')} reset={reset} />)

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(reset).toHaveBeenCalledOnce()
  })
})
