import { useModal } from '@ilokesto/modal'
import type { ChangeEvent } from 'react'

import { Button, Checkbox, Heading, Label } from '@/shared/ui'

const CHECKOUT_TERMS_MODAL_ID = 'checkout-terms'
const CHECKOUT_TERMS_HEADING_ID = 'checkout-terms-title'
const CHECKOUT_TERMS_DESCRIPTION_ID = 'checkout-terms-description'

type AgreeCheckoutTermsControlProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

type CheckoutTermsModalContentProps = {
  onClose: () => void
}

export function AgreeCheckoutTermsControl({
  checked,
  onCheckedChange,
}: AgreeCheckoutTermsControlProps) {
  const { display } = useModal()

  const handleAgreementChange = (e: ChangeEvent<HTMLInputElement>) => {
    onCheckedChange(e.target.checked)
  }

  const handleOpenTerms = () => {
    void display<undefined>({
      id: CHECKOUT_TERMS_MODAL_ID,
      ariaLabelledBy: CHECKOUT_TERMS_HEADING_ID,
      ariaDescribedBy: CHECKOUT_TERMS_DESCRIPTION_ID,
      className: 'max-w-90 rounded-xl bg-(--bg) p-5 text-left text-(--text)',
      dismissible: true,
      position: 'center',
      render: (close) => <CheckoutTermsModalContent onClose={close} />,
    })
  }

  return (
    <>
      <Label>
        <Checkbox checked={checked} onChange={handleAgreementChange} />
        주문 내용 및 약관에 동의합니다
      </Label>
      <Button type="button" variant="link" onClick={handleOpenTerms}>
        약관 보기
      </Button>
    </>
  )
}

function CheckoutTermsModalContent({
  onClose,
}: CheckoutTermsModalContentProps) {
  return (
    <>
      <Heading.H3 id={CHECKOUT_TERMS_HEADING_ID}>이용 약관</Heading.H3>
      <p id={CHECKOUT_TERMS_DESCRIPTION_ID} className="mb-4 text-sm leading-6">
        주문 후 7일 이내 단순 변심 반품이 가능하며, 도서산간은 배송비가
        추가됩니다.
      </p>
      <Button type="button" onClick={onClose}>
        닫기
      </Button>
    </>
  )
}
