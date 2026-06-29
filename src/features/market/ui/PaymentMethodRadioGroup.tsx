import { For } from '@ilokesto/utilinent'
import type { ChangeEvent } from 'react'

import { Label, Radio, RadioGroup } from '@/shared/ui'

export type PaymentMethodOption<T extends string> = {
  value: T
  label: string
}

type PaymentMethodRadioGroupProps<T extends string> = {
  options: Array<PaymentMethodOption<T>>
  value: T
  onChange: (value: T) => void
}

export function PaymentMethodRadioGroup<T extends string>({
  options,
  value,
  onChange,
}: PaymentMethodRadioGroupProps<T>) {
  const handleChangePayment = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedOption = options.find(
      (option) => option.value === e.target.value,
    )

    if (selectedOption) {
      onChange(selectedOption.value)
    }
  }

  return (
    <RadioGroup legend="결제수단" legendClassName="sr-only">
      <For each={options}>
        {(option) => (
          <Label key={option.value}>
            <Radio
              name="payment"
              value={option.value}
              checked={value === option.value}
              onChange={handleChangePayment}
            />
            {option.label}
          </Label>
        )}
      </For>
    </RadioGroup>
  )
}
