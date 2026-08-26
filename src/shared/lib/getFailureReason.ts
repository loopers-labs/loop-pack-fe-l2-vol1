// [AI] TanStack Query v5의 error는 unknown 타입이므로 ApiError로 좁혀서 진짜 메시지를 꺼낸다.
// ApiError가 아니면(예: 네트워크 단절) 기본 메시지로 대체한다.
// 단위 테스트가 가능하도록 ProductList.tsx에서 shared/lib로 추출했다.
import { ApiError } from '@/shared/api/fetcher';

export const getFailureReason = (error: unknown): string => {
  if (error instanceof ApiError) return error.message;
  if (error instanceof TypeError) return '네트워크 연결을 확인해 주세요.';
  return '상품을 불러오지 못했습니다.';
};
