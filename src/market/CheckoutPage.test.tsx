import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CheckoutPage } from './CheckoutPage'

// 이 파일의 핵심: 최종 결제 금액이 "파생값(렌더 중 계산)"으로 유지되는지 검증한다.
// finalPrice를 다시 useState에 박으면(첫 렌더 박제) 아래 갱신 테스트가 깨진다.

describe('CheckoutPage 결제 금액', () => {
  it('초기 렌더에 VIP 할인이 반영된 금액을 보여준다', () => {
    render(<CheckoutPage />)
    expect(
      screen.getByRole('button', { name: /58,500원 결제하기/ }),
    ).toBeInTheDocument()
  })

  it('쿠폰을 적용하면 최종 결제 금액이 다시 계산된다', async () => {
    const user = userEvent.setup()
    render(<CheckoutPage />)

    await user.type(screen.getByPlaceholderText(/쿠폰 코드/), 'WELCOME5000')
    await user.click(screen.getByRole('button', { name: '적용' }))

    expect(
      screen.getByRole('button', { name: /54,000원 결제하기/ }),
    ).toBeInTheDocument()
  })

  it('적립금을 입력하면 최종 결제 금액이 다시 계산된다', async () => {
    const user = userEvent.setup()
    render(<CheckoutPage />)

    await user.click(screen.getByLabelText(/적립금 사용/))
    const pointInput = screen.getByRole('spinbutton')
    await user.clear(pointInput)
    await user.type(pointInput, '4200')

    expect(
      screen.getByRole('button', { name: /54,300원 결제하기/ }),
    ).toBeInTheDocument()
  })

  it('도서산간 주소를 선택하면 배송비가 더해진다', async () => {
    const user = userEvent.setup()
    render(<CheckoutPage />)

    await user.click(screen.getByRole('button', { name: '변경' }))
    await user.click(screen.getByRole('radio', { name: /본가/ }))

    expect(
      screen.getByRole('button', { name: /61,500원 결제하기/ }),
    ).toBeInTheDocument()
  })
})

describe('CheckoutPage 약관 동의 게이트', () => {
  it('약관에 동의하기 전에는 결제 버튼이 비활성화된다', async () => {
    const user = userEvent.setup()
    render(<CheckoutPage />)

    const payButton = screen.getByRole('button', { name: /결제하기/ })
    expect(payButton).toBeDisabled()

    await user.click(screen.getByLabelText(/약관에 동의/))
    expect(payButton).toBeEnabled()
  })
})
