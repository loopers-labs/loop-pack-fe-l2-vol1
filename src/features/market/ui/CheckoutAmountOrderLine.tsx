import { OrderLine } from '@/entities/market'

type CheckoutAmountOrderLineProps = {
  label: string
  amount: number
}

export function CheckoutAmountOrderLine({
  label,
  amount,
}: CheckoutAmountOrderLineProps) {
  return (
    <OrderLine.Root>
      <OrderLine.Content>
        <OrderLine.Title>{label}</OrderLine.Title>
      </OrderLine.Content>
      <OrderLine.Amount amount={amount} />
    </OrderLine.Root>
  )
}
