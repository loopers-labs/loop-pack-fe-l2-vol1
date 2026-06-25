import { DISCOUNT_RATE } from '../../shared/constants/discount';
import type { Member } from '../types/types';

type Props = {
  amount: number;
  member: Member;
};

// 여기저기서 쓰는 '공통' 금액 표시 컴포넌트.
export function Price({ amount, member }: Props) {
  const value = Math.round(amount * (1 - DISCOUNT_RATE[member.grade]));
  return <strong>{value.toLocaleString()}원</strong>;
}
