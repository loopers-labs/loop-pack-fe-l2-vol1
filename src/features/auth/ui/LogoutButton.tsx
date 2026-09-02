'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { logoutMutationOptions } from '../api/mutations';

import { reset } from '@/analytics/events';
import { orderQueries, useCheckoutActions } from '@/entities/order';
import { useSessionActions } from '@/entities/session';

export function LogoutButton() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { clearUser } = useSessionActions();
  const { clearCheckoutDraft } = useCheckoutActions();
  const { mutate, isPending, error } = useMutation({
    ...logoutMutationOptions,
    onSuccess: () => {
      // 장바구니·위시리스트는 브라우저가 유일한 원본이라 두고, 계정 범위 상태만 정리한다
      clearUser();
      reset();
      clearCheckoutDraft();

      queryClient.removeQueries({ queryKey: orderQueries.all() });

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
