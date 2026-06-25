import { Button, Heading, Price, SectionCard } from '@/shared/ui'

type OrderCompleteSectionProps = {
  setPlaced: (value: boolean) => void
  memberDisplayPrice: number
}

export function OrderCompleteSection({
  setPlaced,
  memberDisplayPrice,
}: OrderCompleteSectionProps) {
  return (
    <>
      <Heading.H1>주문 완료</Heading.H1>
      <SectionCard>
        <p className="text-(--text-h)">
          주문이 접수되었어요. 결제 금액 <Price value={memberDisplayPrice} />
        </p>
      </SectionCard>
      <Button
        type="button"
        className="sticky bottom-4 mt-2 w-full rounded-xl p-3.75 text-base font-semibold"
        variant="primary"
        onClick={() => {
          setPlaced(false)
        }}
      >
        주문서로 돌아가기
      </Button>
    </>
  )
}
