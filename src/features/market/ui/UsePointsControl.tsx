import { Show } from '@ilokesto/utilinent'
import type { ChangeEvent } from 'react'
import { useState } from 'react'

import { Checkbox, Input, Label } from '@/shared/ui'

type UsePointsControlProps = {
  currentPoint: number
  onChangePoint: (value: number) => void
}

export function UsePointsControl({
  currentPoint,
  onChangePoint,
}: UsePointsControlProps) {
  const [pointInput, setPointInput] = useState(0)
  const [usePoint, setUsePoint] = useState(false)

  const handlePointInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextPointInput = Math.min(
      Math.max(Number(e.target.value), 0),
      currentPoint,
    )

    setPointInput(nextPointInput)
    onChangePoint(nextPointInput)
  }

  const handleUsePointChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUsePoint(e.target.checked)

    if (!e.target.checked) {
      setPointInput(0)
      onChangePoint(0)
    }
  }

  return (
    <>
      <Label>
        <Checkbox checked={usePoint} onChange={handleUsePointChange} />
        적립금 사용 (보유 {currentPoint.toLocaleString()}P)
      </Label>
      <Show when={usePoint}>
        <Input
          aria-label="사용할 적립금"
          type="number"
          value={pointInput}
          min={0}
          max={currentPoint}
          onChange={handlePointInputChange}
        />
      </Show>
    </>
  )
}
