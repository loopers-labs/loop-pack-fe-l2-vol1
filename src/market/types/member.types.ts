export type MemberGrade = 'VIP' | 'NORMAL';

export type Member = {
  name: string;
  grade: MemberGrade;
  point: number; // 보유 적립금
};
