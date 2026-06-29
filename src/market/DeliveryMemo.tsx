type DeliveryMemoProps = {
  memo: string;
  onChangeMemo: (memo: string) => void;
};

export function DeliveryMemo({ memo, onChangeMemo }: DeliveryMemoProps) {
  return (
    <textarea
      value={memo}
      onChange={(e) => onChangeMemo(e.target.value)}
      placeholder="배송 시 요청사항 (예: 부재 시 문 앞에 두세요)"
    />
  );
}
