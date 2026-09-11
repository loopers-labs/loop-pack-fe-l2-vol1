import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LogoutButton } from '@/features/logout/ui/LogoutButton'

describe('LogoutButton', () => {
  it('클릭하면 로그아웃 핸들러를 호출한다', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(<LogoutButton onClick={onClick} isPending={false} />)
    await user.click(screen.getByRole('button', { name: '로그아웃' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
