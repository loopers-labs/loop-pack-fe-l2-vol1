'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { logout } from '@/entities/session/api/session';
import { isProtectedPath } from '@/shared/config/protected-routes';

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // 세션 관련 캐시를 전부 비운다(카트·위시리스트는 zustand라 영향 없음 —
      // 로그아웃해도 유지하기로 한 결정 그대로 유지된다). 다른 계정으로
      // 다시 로그인했을 때 이전 계정의 주문 데이터가 잠깐 보이는 걸 막는다.
      queryClient.clear();

      // 보호 경로에 있던 채로 로그아웃하면 그 자리에 남겨두지 않는다.
      // 남겨두면 다음 요청에서 401을 받아 전역 401 핸들러가 "세션 만료"로
      // 잘못 안내할 수 있다 — 이건 만료가 아니라 자발적 로그아웃이다.
      if (isProtectedPath(window.location.pathname)) {
        router.push('/');
      }
    },
  });

  return {
    handleLogout: () => mutation.mutate(),
    isPending: mutation.isPending,
  };
}
