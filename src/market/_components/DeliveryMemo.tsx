/** ② 구현 vs 조합: 내부 useState 제거 → value/onChange를 받는 제어 컴포넌트로 변경 */
export function DeliveryMemo({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="배송 시 요청사항 (예: 부재 시 문 앞에 두세요)"
    />
  )
}
