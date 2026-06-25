import { For } from '@ilokesto/utilinent'
import { useState } from 'react'

import { Heading, Label, Radio, RadioGroup, SectionCard } from '@/shared/ui'

export function PaymentMethodSection<T extends string>({
  paymentOptions,
  onChangePayment,
  defaultPayment,
}: {
  paymentOptions: Record<T, string>
  defaultPayment: T
  onChangePayment: (payment: T) => void
}) {
  const [payment, setPayment] = useState<T>(defaultPayment)

  const handleChangePayment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPayment = e.target.value as T
    setPayment(newPayment)
    onChangePayment(newPayment)
  }

  return (
    <SectionCard>
      <Heading.H2>결제수단</Heading.H2>
      <RadioGroup legend="결제수단" legendClassName="sr-only">
        <For each={Object.entries(paymentOptions) as Array<[T, string]>}>
          {([key, value]) => (
            <Label key={key}>
              <Radio
                name="payment"
                value={key}
                checked={payment === key}
                onChange={handleChangePayment}
              />
              {value}
            </Label>
          )}
        </For>
      </RadioGroup>
    </SectionCard>
  )
}
