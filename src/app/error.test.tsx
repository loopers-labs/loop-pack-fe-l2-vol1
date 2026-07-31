import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ErrorBoundaryFallback from './error'

// Next의 route 경계에 이 컴포넌트가 실제로 걸리는지는 여기서 검증하지 못한다.
// 그것은 수동 확인 항목으로 남기고, 여기서는 fallback이 무엇을 보여주고
// reset이 어디에 연결되는지를 고정한다.

describe('루트 error 경계의 fallback', () => {
  it('두 출구를 보여준다', () => {
    render(<ErrorBoundaryFallback error={new Error('실패')} reset={vi.fn()} />)

    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '홈으로' })).toHaveAttribute(
      'href',
      '/',
    )
  })

  it('원인 메시지를 사용자에게 노출하지 않는다', () => {
    // 예상 밖 오류의 메시지에는 내부 경로나 모듈 이름이 섞일 수 있다.
    const internal = "Cannot read properties of undefined (reading 'products')"

    render(
      <ErrorBoundaryFallback error={new Error(internal)} reset={vi.fn()} />,
    )

    expect(screen.queryByText(internal)).toBeNull()
  })

  it('digest가 있으면 문의용 코드로 보여준다', () => {
    const error = Object.assign(new Error('실패'), { digest: 'abc123' })

    render(<ErrorBoundaryFallback error={error} reset={vi.fn()} />)

    expect(screen.getByText(/abc123/)).toBeInTheDocument()
  })

  it('다시 시도가 reset을 부른다', () => {
    const reset = vi.fn()
    render(<ErrorBoundaryFallback error={new Error('실패')} reset={reset} />)

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(reset).toHaveBeenCalledOnce()
  })
})
