import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { InlineQueryError } from './InlineQueryError'

describe('InlineQueryError', () => {
  it('calls the retry action when the user clicks 다시 시도', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(
      <InlineQueryError
        message="상품을 불러오지 못했습니다."
        isRetrying={false}
        onRetry={onRetry}
      />,
    )

    await user.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(onRetry).toHaveBeenCalledOnce()
  })
})
