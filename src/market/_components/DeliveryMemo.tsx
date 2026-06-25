// memo state가 컴포넌트 안에 갇히면 주문 데이터에 실리지 않아서 상위로 올림
type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function DeliveryMemo({ value, onChange }: Props) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="배송 시 요청사항 (예: 부재 시 문 앞에 두세요)"
    />
  );
}
