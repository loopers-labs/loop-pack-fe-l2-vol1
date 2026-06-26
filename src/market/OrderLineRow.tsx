import type { ReactNode } from "react";
import { formatWon } from "./format";

type Props = {
  amount: number;
  isDiscount?: boolean;
  thumbnail?: string;
  children: ReactNode;
};

export function OrderLineRow({ amount, isDiscount, thumbnail, children }: Props) {
  return (
    <div className="line">
      {thumbnail ? <span className="thumb">{thumbnail}</span> : null}
      <div className="grow">{children}</div>
      <strong style={{ color: isDiscount ? "#ef4444" : "var(--text-h)" }}>
        {isDiscount ? "- " : ""}
        {formatWon(amount)}
      </strong>
    </div>
  );
}
