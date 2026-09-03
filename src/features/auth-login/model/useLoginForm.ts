'use client';

import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login } from '@/entities/session/api/session';
import {
  sessionQueries,
  LOGIN_MUTATION_KEY,
} from '@/entities/session/api/sessionQueries';
import { getSafeRedirectPath } from '@/features/auth-login/model/redirect';
import { ApiError } from '@/shared/api';
import { track, identify } from '@/analytics/logger';

const HTTP_BAD_REQUEST = 400;

type Params = {
  redirect: string | null;
};

// 시드 로그의 login_fail reason과 형식을 맞춘다(SCREAMING_SNAKE_CASE 코드).
// API가 실제로 구분해서 주는 값이 아니라 상태 코드 기준으로 우리가 분류한다.
function toFailReason(error: unknown): string {
  if (!(error instanceof ApiError)) return 'UNKNOWN_ERROR';
  if (error.status === HTTP_BAD_REQUEST) return 'INVALID_REQUEST';
  return 'INVALID_CREDENTIALS';
}

export function useLoginForm({ redirect }: Params) {
  const queryClient = useQueryClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationKey: LOGIN_MUTATION_KEY,
    mutationFn: login,
    onSuccess: (user) => {
      queryClient.setQueryData(sessionQueries.me().queryKey, user);
      identify(user.id);
      track('login_success', { from: redirect ?? 'direct', userId: user.id });
      // router.push(소프트 네비게이션)이 아니라 하드 네비게이션을 쓴다 —
      // 이 경로가 로그인 전에 이미 한 번 middleware 리다이렉트를 거친
      // 적이 있으면(보호 경로 최초 진입 시 항상 그렇다) 클라이언트 라우터가
      // 그 결과를 재사용해 실제로는 이동하지 않는 문제가 있었다(5단계
      // 자가 검증 중 발견, docs/rfc/week09-e2e-scope.md 관련 기록 참고).
      // redirectToExpiredLogin()도 이미 같은 이유로 하드 네비게이션을 쓴다.
      window.location.href = getSafeRedirectPath(redirect);
    },
    onError: (error) => {
      track('login_fail', { reason: toFailReason(error) });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate({ email, password });
  };

  const errorMessage =
    mutation.error instanceof ApiError ? mutation.error.message : null;

  return {
    email,
    setEmail,
    password,
    setPassword,
    handleSubmit,
    isPending: mutation.isPending,
    errorMessage,
  };
}
