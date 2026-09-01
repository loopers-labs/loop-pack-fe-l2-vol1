'use client';

import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
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
      router.push(getSafeRedirectPath(redirect));
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
