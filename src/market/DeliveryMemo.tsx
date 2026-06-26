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
