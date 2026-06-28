type ProductOrderLineProps = {
  label: string;
  amount: number;
  thumbnail: string;
  option?: string;
  quantity: number;
};

type LineAmountProps = {
  amount: number;
  isDiscount?: boolean;
};

function LineAmount({ amount, isDiscount = false }: LineAmountProps) {
  return (
    <strong style={{ color: isDiscount ? "#ef4444" : "var(--text-h)" }}>
      {isDiscount ? "- " : ""}
      {amount.toLocaleString()}원
    </strong>
  );
}

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
      <LineAmount amount={amount} />
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
      <LineAmount amount={amount} isDiscount />
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
      <LineAmount amount={amount} />
    </div>
  );
}
