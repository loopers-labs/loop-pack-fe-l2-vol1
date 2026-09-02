// [AI] getLoginErrorMessage 단위 테스트. 서버가 실제로 주는 401/400 응답 본문을 그대로 넣어
// "상태 코드에 따라 다른 문구가 나오는지"를 검증한다 (문구 자체가 목적이 아니라 분기가 목적).
import { describe, it, expect } from 'vitest';
import { ApiError } from '@/shared/api/fetcher';
import { getLoginErrorMessage } from './getLoginErrorMessage';

describe('getLoginErrorMessage', () => {
  it('401(자격 증명 불일치)이면 가입 정보 확인 안내를 돌려준다', () => {
    // 서버(login/route.ts)가 401에 실제로 실어 보내는 본문
    const message = getLoginErrorMessage(new ApiError('이메일 또는 비밀번호를 확인해주세요.', 401));

    expect(message).toBe('이메일 또는 비밀번호가 일치하지 않아요. 다시 확인해 주세요.');
  });

  it('400(형식 오류)이면 입력 형식 안내를 돌려준다 — 401과 다른 문구', () => {
    // 서버가 400에 실제로 실어 보내는 본문
    const message = getLoginErrorMessage(new ApiError('요청 조건을 확인해주세요.', 400));

    expect(message).toBe('이메일과 비밀번호 형식을 확인해 주세요.');
    // [AI] "분기"의 핵심 단언: 같은 실패라도 401과 400의 문구가 달라야 한다.
    expect(message).not.toBe(
      getLoginErrorMessage(new ApiError('이메일 또는 비밀번호를 확인해주세요.', 401))
    );
  });

  it('그 외(5xx, 네트워크 오류)는 공통 재시도 안내를 돌려준다', () => {
    const generic = '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.';

    expect(getLoginErrorMessage(new ApiError('로그인에 실패했습니다.', 500))).toBe(generic);
    expect(getLoginErrorMessage(new TypeError('fetch failed'))).toBe(generic);
  });
});
