type PayButtonProps = {
  finalPrice: number;
  disabled: boolean;
  onClick: () => void;
};

export function PayButton({ finalPrice, disabled, onClick }: PayButtonProps) {
  return (
    <button className="pay" disabled={disabled} onClick={onClick}>
      {finalPrice.toLocaleString()}원 결제하기
    </button>
  );
}
