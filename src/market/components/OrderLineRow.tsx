import type { ReactNode } from "react";
import { Price } from "./Price";

type Props = {
  thumbnail?: ReactNode;
  children: ReactNode;
  amount: number;
  isDiscount?: boolean;
};

export function OrderLineRow({
  thumbnail,
  children,
  amount,
  isDiscount,
}: Props) {
  return (
    <div className="line">
      {thumbnail ? <span className="thumb">{thumbnail}</span> : null}
      <div className="grow">{children}</div>
      <Price amount={amount} isDiscount={isDiscount} />
    </div>
  );
}
