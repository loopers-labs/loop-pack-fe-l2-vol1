// 회원 등급별 할인율을 상수로 정의
import type { Grade } from '../../market/types/types';

export const DISCOUNT_RATE: Record<Grade, number> = {
  // 일반 사용자의 할인율도 변경될 여지가 있으므로 같이 정의
  NORMAL: 0,
  VIP: 0.1,
};
