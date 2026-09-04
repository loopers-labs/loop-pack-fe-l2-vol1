'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { logout, sessionQueries } from '@/entities/session';

// 로그아웃은 세션에서 파생된 것만 정리한다 (RFC D6): 세션 캐시 → null, 서버 트리 재렌더.
// 장바구니·위시리스트는 건드리지 않는다 — 세션이 아니라 이 탭의 소유물이다.
export function LogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(sessionQueries.me().queryKey, null);
      // 보호 경로에 있었다면 서버가 다시 렌더하면서 proxy가 로그인으로 보낸다.
      router.refresh();
    },
  });

  return (
    <button type="button" disabled={isPending} onClick={() => mutate()}>
      로그아웃
    </button>
  );
}
