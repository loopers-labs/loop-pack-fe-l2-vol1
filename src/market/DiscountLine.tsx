// [AI 생성] 직접 검토·수정함
import { LineAmount } from "./LineAmount";

// 쿠폰·적립금처럼 항상 할인인 줄. code는 쿠폰처럼 부가 표시가 있을 때만.
type Props = {
  label: string;
  amount: number;
  code?: string;
};

export function DiscountLine({ label, amount, code }: Props) {
  return (
    <div className="line">
      <div className="grow">
        <span>{label}</span>
        {code ? <small>{code}</small> : null}
      </div>
      <LineAmount amount={amount} isDiscount />
    </div>
  );
}
