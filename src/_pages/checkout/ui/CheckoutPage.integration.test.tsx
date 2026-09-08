import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { JSX } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useToggleCart } from '@/entities/cart'
import { CheckoutPage } from './CheckoutPage'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

function CartSetup(): JSX.Element {
  const toggleCart = useToggleCart()

  return (
    <>
      <button type="button" onClick={() => toggleCart('p1')}>
        p1 담기
      </button>
      <button type="button" onClick={() => toggleCart('p2')}>
        p2 담기
      </button>
    </>
  )
}

describe('CheckoutPage', () => {
  it('제목과 현재 장바구니 개수 및 상품 ID를 주문 버튼과 함께 보여준다', async () => {
    const user = userEvent.setup()
    render(
      <>
        <CartSetup />
        <CheckoutPage />
      </>,
    )

    await user.click(screen.getByRole('button', { name: 'p1 담기' }))
    await user.click(screen.getByRole('button', { name: 'p2 담기' }))

    expect(
      screen.getByRole('heading', { level: 1, name: '주문서' }),
    ).toBeInTheDocument()
    expect(screen.getByText('총 2개 상품')).toBeInTheDocument()
    const cartList = screen.getByRole('list', { name: '장바구니 상품' })
    expect(within(cartList).getAllByRole('listitem')).toHaveLength(2)
    expect(within(cartList).getByText('p1')).toBeInTheDocument()
    expect(within(cartList).getByText('p2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '주문하기' })).toBeEnabled()
  })
})
