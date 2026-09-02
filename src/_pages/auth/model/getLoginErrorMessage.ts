import { ApiError } from '@/shared/api/fetcher';

// [AI] 로그인 실패 응답을 사용자 안내 문구로 바꾼다 (getFailureReason과 같은 순수 함수 패턴).
// 401(자격 증명 불일치)과 400(형식 오류)은 사용자가 취할 행동이 다르다:
//   400 = 지금 입력값 자체를 고친다 / 401 = 가입 정보(이메일 또는 비밀번호)를 다시 확인한다.
// 그래서 서버 메시지를 그대로 보여주지 않고 상태 코드에 맞는 문구로 분기한다.
export const getLoginErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return '이메일 또는 비밀번호가 일치하지 않아요. 다시 확인해 주세요.';
    }
    if (error.status === 400) {
      return '이메일과 비밀번호 형식을 확인해 주세요.';
    }
  }
  // 그 외(5xx, 네트워크 단절 등): 재시도 안내가 맞는 유일한 공통 문구.
  return '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.';
};
