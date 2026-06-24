type ProductOrderLineProps = {
  label: string;
  amount: number;
  thumbnail: string;
  option?: string;
  quantity: number;
};

export function ProductOrderLine({
  label,
  amount,
  thumbnail,
  option,
  quantity,
}: ProductOrderLineProps) {
  return (
    <div className="line">
      <span className="thumb">{thumbnail}</span>
      <div className="grow">
        <span>{label}</span>
        {option ? (
          <small>
            {option} · 수량 {quantity}
          </small>
        ) : null}
      </div>
      <strong style={{ color: "var(--text-h)" }}>{amount.toLocaleString()}원</strong>
    </div>
  );
}

type DiscountAmountLineProps = {
  label: string;
  amount: number;
  description?: string;
};

export function DiscountAmountLine({ label, amount, description }: DiscountAmountLineProps) {
  return (
    <div className="line">
      <div className="grow">
        <span>{label}</span>
        {description ? <small>{description}</small> : null}
      </div>
      <strong style={{ color: "#ef4444" }}>- {amount.toLocaleString()}원</strong>
    </div>
  );
}

type SummaryAmountLineProps = {
  label: string;
  amount: number;
};

export function SummaryAmountLine({ label, amount }: SummaryAmountLineProps) {
  return (
    <div className="line">
      <div className="grow">
        <span>{label}</span>
      </div>
      <strong style={{ color: "var(--text-h)" }}>{amount.toLocaleString()}원</strong>
    </div>
  );
}
