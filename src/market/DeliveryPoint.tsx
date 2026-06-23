interface DeliveryPointProps {
  usePoint: boolean
  setUsePoint: React.Dispatch<React.SetStateAction<boolean>>
  pointInput: number
  setPointInput: React.Dispatch<React.SetStateAction<number>>
  point: string
}

export function DeliveryPoint({
  usePoint,
  setUsePoint,
  pointInput,
  setPointInput,
  point,
}: DeliveryPointProps) {
  return (
    <div className="section">
      <h2>적립금</h2>
      <label>
        <input type="checkbox" checked={usePoint} onChange={(e) => setUsePoint(e.target.checked)} />
        적립금 사용 (보유 {point}P)
      </label>
      {usePoint ? (
        <input
          type="number"
          value={pointInput}
          onChange={(e) => setPointInput(Number(e.target.value))}
        />
      ) : null}
    </div>
  )
}
