// [AI 생성] 직접 검토·수정함
import { LineAmount } from "./LineAmount";

type Props = {
  label: string;
  amount: number;
};

export function AmountLine({ label, amount }: Props) {
  return (
    <div className="line">
      <div className="grow">
        <span>{label}</span>
      </div>
      <LineAmount amount={amount} />
    </div>
  );
}
