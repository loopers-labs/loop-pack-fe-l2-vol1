export default function PlaceOrderButton({
  finalPrice,
  disabled,
  onPlaceOrder,
}: {
  finalPrice: number;
  disabled: boolean;
  onPlaceOrder: () => void;
}) {
  return (
    <button className="pay" disabled={disabled} onClick={onPlaceOrder}>
      {finalPrice.toLocaleString()}원 결제하기
    </button>
  );
}
