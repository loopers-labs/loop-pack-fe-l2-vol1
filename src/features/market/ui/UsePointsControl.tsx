import { Show } from '@ilokesto/utilinent'
import type { ChangeEvent } from 'react'
import { useState } from 'react'

import { Checkbox, Input, Label } from '@/shared/ui'

type UsePointsControlProps = {
  currentPoint: number
  onChangePointsToUse: (pointsToUse: number) => void
}

export function UsePointsControl({
  currentPoint,
  onChangePointsToUse,
}: UsePointsControlProps) {
  const [pointsToUse, setPointsToUse] = useState(0)
  const [isUsingPoints, setIsUsingPoints] = useState(false)

  const handlePointsToUseChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextPointsToUse = Math.min(
      Math.max(Number(e.target.value), 0),
      currentPoint,
    )

    setPointsToUse(nextPointsToUse)
    onChangePointsToUse(nextPointsToUse)
  }

  const handlePointUsageChange = (e: ChangeEvent<HTMLInputElement>) => {
    setIsUsingPoints(e.target.checked)

    if (!e.target.checked) {
      setPointsToUse(0)
      onChangePointsToUse(0)
    }
  }

  return (
    <>
      <Label>
        <Checkbox checked={isUsingPoints} onChange={handlePointUsageChange} />
        적립금 사용 (보유 {currentPoint.toLocaleString()}P)
      </Label>
      <Show when={isUsingPoints}>
        <Input
          aria-label="사용할 적립금"
          type="number"
          value={pointsToUse}
          min={0}
          max={currentPoint}
          onChange={handlePointsToUseChange}
        />
      </Show>
    </>
  )
}
