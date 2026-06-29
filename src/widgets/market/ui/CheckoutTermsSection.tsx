import { AgreeCheckoutTermsControl } from '@/features/market'
import { SectionCard } from '@/shared/ui'

type CheckoutTermsSectionProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function CheckoutTermsSection({
  checked,
  onCheckedChange,
}: CheckoutTermsSectionProps) {
  return (
    <SectionCard>
      <AgreeCheckoutTermsControl
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </SectionCard>
  )
}
