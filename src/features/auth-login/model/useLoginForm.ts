'use client';

import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { login } from '@/entities/session/api/session';
import {
  sessionQueries,
  LOGIN_MUTATION_KEY,
} from '@/entities/session/api/sessionQueries';
import { getSafeRedirectPath } from '@/features/auth-login/model/redirect';
import { ApiError } from '@/shared/api';

export function useLoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [redirect] = useQueryState('redirect');
  const [reason] = useQueryState('reason');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationKey: LOGIN_MUTATION_KEY,
    mutationFn: login,
    onSuccess: (user) => {
      queryClient.setQueryData(sessionQueries.me().queryKey, user);
      router.push(getSafeRedirectPath(redirect));
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
    expiredNotice: reason === 'expired',
  };
}
