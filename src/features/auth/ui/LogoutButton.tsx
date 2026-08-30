'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { logoutMutationOptions } from '../api/mutations';

import { useSessionActions } from '@/entities/session';

export function LogoutButton() {
  const router = useRouter();
  const { clearUser } = useSessionActions();
  const { mutate, isPending, error } = useMutation({
    ...logoutMutationOptions,
    onSuccess: () => {
      clearUser();
      router.replace('/');
    },
  });

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          mutate();
        }}
      >
        로그아웃
      </button>
      {error && <p role="alert">{error.message}</p>}
    </>
  );
}
