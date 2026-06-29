import { UsePointsControl } from '@/features/market'
import { Heading, SectionCard } from '@/shared/ui'

export function PointSection({
  currentPoint,
  onPointsToUseChange,
}: {
  currentPoint: number
  onPointsToUseChange: (pointsToUse: number) => void
}) {
  return (
    <SectionCard>
      <Heading.H2>적립금</Heading.H2>
      <UsePointsControl
        currentPoint={currentPoint}
        onChangePointsToUse={onPointsToUseChange}
      />
    </SectionCard>
  )
}
