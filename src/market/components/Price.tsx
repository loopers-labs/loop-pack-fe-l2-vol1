import type { Member } from "../types";
import { calculateMemberPrice } from "../../utils";

type Props = {
  amount: number;
  member?: Member;
};

// 여기저기서 쓰는 '공통' 금액 표시 컴포넌트.
export function Price({ amount, member }: Props) {
  const value = calculateMemberPrice(amount, member);

  return <strong>{value.toLocaleString()}원</strong>;
}
