'use client';

import { useEffect, useRef } from 'react';

import { HttpError } from '@/shared/api/httpError';
import { trackLoginFail, trackLoginStart, trackLoginSuccess } from '@/shared/lib/analytics/events';
import { identifyUser } from '@/shared/lib/analytics/identity';
import { isSafeRedirect } from '@/shared/lib/isSafeRedirect';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { requestLogin } from '../api/loginRequest';
import { toLoginEntryPoint } from './toLoginEntryPoint';

/**
 * 시드 로그가 문구가 아니라 코드값을 쓰므로 상태를 코드로 옮긴다.
 * 자격 증명이 틀린 것과 서버가 죽은 것은 대응이 다르므로 한 값으로 뭉치지 않는다.
 */
function toFailReason(error: Error): string {
  if (error instanceof HttpError && error.status === 401) {
    return 'INVALID_CREDENTIALS';
  }

  return 'REQUEST_FAILED';
}

/**
 * 로그인 제출과 그 계측.
 *
 * 화면은 이 훅만 부른다. 제출 상태를 useState 로 따로 들지 않는다 — isPending 도 실패
 * 메시지도 요청 하나에서 파생되는 값이라 useMutation 이 이미 갖고 있다.
 *
 * 진입 경로(from)는 마운트 시점 값을 ref 에 담아 성공 이벤트까지 같은 값을 쓴다.
 * 로그인 도중 URL 이 바뀌어 start 와 success 의 from 이 갈리면 3단계에서 두 이벤트를
 * 같은 경로로 이어 붙일 수 없다.
 */
export function useLogin(returnTo: string | undefined) {
  const router = useRouter();
  const entryPoint = useRef(toLoginEntryPoint(returnTo));

  useEffect(() => {
    trackLoginStart(entryPoint.current);
  }, []);

  return useMutation({
    mutationFn: requestLogin,
    onSuccess: ({ user }) => {
      // 이후 이벤트에 userId 가 붙기 시작한다. 시드 로그가 "로그인한 뒤의 이벤트에만"
      // userId 를 갖는 것과 같은 성질이라, 성공 이벤트보다 먼저 채운다.
      identifyUser(user.id);
      trackLoginSuccess(entryPoint.current);

      // 검증에 실패한 returnTo 는 조용히 버리고 홈으로 보낸다. 외부 주소로 나가지 않게 하는 지점이다.
      //
      // push 가 아니라 replace 다. push 면 로그인 화면이 히스토리에 남아, 이동한 뒤 뒤로 가기를
      // 누르면 세션이 살아 있는데도 로그인 폼이 다시 뜬다. 로그인은 지나가는 관문이지
      // 돌아갈 목적지가 아니다.
      router.replace(returnTo !== undefined && isSafeRedirect(returnTo) ? returnTo : '/');
      // 서버 컴포넌트가 새 세션 쿠키로 헤더를 다시 그리게 한다.
      router.refresh();
    },
    onError: (error: Error) => {
      trackLoginFail(toFailReason(error));
    },
  });
}
