'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { SESSION_QUERY_KEY } from '@/entities/session/api/sessionQueryOptions';
import { ApiError, UNAUTHORIZED_STATUS } from '@/shared/api/response';
import { LOGIN_FAIL_REASON } from '@/analytics/events';
import type { LoginFailReason } from '@/analytics/events';
import { trackLoginFail, trackLoginSuccess } from '@/analytics/trackEvents';
import type { LoginRequest, SessionResponse } from '@/entities/session/model/session';

const LOGIN_FAILED_MESSAGE = '로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.';

/**
 * 요청을 보내지 못했다는 표시.
 *
 * `TypeError`인지로 가리지 않는 이유 — fetch가 실패할 때 던지는 것도 TypeError지만, 응답을
 * 받은 뒤 값을 다루다 나는 오류도 TypeError일 수 있다. 실패한 지점으로 가리면 나중에 이 함수에
 * 코드가 늘어도 판정이 흔들리지 않는다.
 */
class RequestNotSentError extends Error {
  constructor(cause: unknown) {
    super(LOGIN_FAILED_MESSAGE, { cause });
    this.name = 'RequestNotSentError';
  }
}

/** fetch 호출만 감싼다. 응답을 받은 뒤의 실패는 여기 들어오지 않는다 */
async function sendLoginRequest(credentials: LoginRequest): Promise<Response> {
  try {
    return await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
  } catch (error) {
    throw new RequestNotSentError(error);
  }
}

/**
 * 로그에 남길 실패 사유를 가른다.
 *
 * 화면에는 사유를 나눠 보여주지 않지만, 로그까지 한 종류로 뭉치면 서버 오류와 비밀번호 오류를
 * 나중에 구분할 수 없다.
 */
function toLoginFailReason(error: unknown): LoginFailReason {
  if (error instanceof ApiError) {
    return error.status === UNAUTHORIZED_STATUS
      ? LOGIN_FAIL_REASON.INVALID_CREDENTIALS
      : LOGIN_FAIL_REASON.SERVER_ERROR;
  }
  if (error instanceof RequestNotSentError) {
    return LOGIN_FAIL_REASON.NETWORK_ERROR;
  }
  return LOGIN_FAIL_REASON.UNKNOWN_ERROR;
}

/**
 * 로그인하고 원래 가려던 경로로 되돌린다.
 *
 * 이 mutation의 401은 자격 증명 불일치이지 세션 만료가 아니다. 그래서 `meta.authRequired`를
 * 붙이지 않는다 — providers의 전역 처리기는 그 표시가 있는 요청의 401만 만료로 다룬다.
 * 표시를 붙이면 비밀번호를 틀렸을 뿐인데 "세션이 만료되었습니다"가 뜬다.
 */
export function useLoginMutation(redirectPath: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<SessionResponse> => {
      const response = await sendLoginRequest(credentials);

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new ApiError(response.status, body?.message ?? LOGIN_FAILED_MESSAGE);
      }

      return (await response.json()) as SessionResponse;
    },
    onError: (error) => {
      // 실패한 시도라 사용자를 특정할 근거가 없어 identifyUser()는 부르지 않는다
      trackLoginFail(toLoginFailReason(error));
    },
    onSuccess: ({ user }) => {
      // 세션 캐시를 먼저 채운다. 공통 프로퍼티가 이 캐시를 읽고, 프로바이더에 알리는 일도
      // 이벤트를 보내는 자리에서 이 캐시를 기준으로 하므로, 뒤로 미루면 둘 다 어긋난다
      queryClient.setQueryData(SESSION_QUERY_KEY, user);
      trackLoginSuccess(redirectPath);
      router.replace(redirectPath);
      // 보호 경로는 서버가 세션을 읽어 그리므로, 이동 후 서버 렌더를 다시 받아야 내용이 채워진다
      router.refresh();
    },
  });
}
