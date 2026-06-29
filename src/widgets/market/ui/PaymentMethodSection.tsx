import {
  type PaymentMethodOption,
  PaymentMethodRadioGroup,
} from '@/features/market'
import { Heading, SectionCard } from '@/shared/ui'

export function PaymentMethodSection<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<PaymentMethodOption<T>>
  value: T
  onChange: (payment: T) => void
}) {
  return (
    <SectionCard>
      <Heading.H2>결제수단</Heading.H2>
      <PaymentMethodRadioGroup
        options={options}
        value={value}
        onChange={onChange}
      />
    </SectionCard>
  )
}
