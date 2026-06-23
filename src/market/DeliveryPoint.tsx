import { useCheckout } from './context'

export function DeliveryPoint() {
  const { usePoint, setUsePoint, pointInput, setPointInput, member } = useCheckout()
  return (
    <div className="section">
      <h2>적립금</h2>
      <label>
        <input type="checkbox" checked={usePoint} onChange={(e) => setUsePoint(e.target.checked)} />
        적립금 사용 (보유 {member.point.toLocaleString()}P)
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
