'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { logout } from '@/entities/session/api/session';
import { sessionQueries } from '@/entities/session/api/sessionQueries';
import { ordersQueries } from '@/entities/order/api/ordersQueries';
import { isProtectedPath } from '@/shared/config/protected-routes';
import { reset } from '@/analytics/logger';
import { ApiError } from '@/shared/api';

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // 계측 도구에 쌓인 사용자 식별 정보를 지운다(identify()의 반대).
      reset();

      // 세션 쿼리가 아직 캐시에 살아있는 상태에서 값을 null로 명시적으로
      // 채운다 — clear()로 먼저 지워버리면 헤더가 관찰하던 쿼리 자체가
      // 없어져서 갱신이 확실히 전파되지 않을 수 있다. setQueryData는
      // 살아있는 쿼리를 관찰 중인 곳(헤더)에 즉시 알린다.
      queryClient.setQueryData(sessionQueries.me().queryKey, null);

      // 계정별로 소유된 주문 데이터만 지운다(카트·위시리스트는 zustand라
      // 영향 없음 — 로그아웃해도 유지하기로 한 결정 그대로 유지된다).
      // 다른 계정으로 다시 로그인했을 때 이전 계정의 주문이 잠깐 보이는
      // 걸 막는다. 상품·홈 데이터는 계정과 무관한 공개 데이터라 그대로 둔다.
      queryClient.removeQueries({ queryKey: ordersQueries.all() });

      // 보호 경로에 있던 채로 로그아웃하면 그 자리에 남겨두지 않는다.
      // 남겨두면 다음 요청에서 401을 받아 전역 401 핸들러가 "세션 만료"로
      // 잘못 안내할 수 있다 — 이건 만료가 아니라 자발적 로그아웃이다.
      if (isProtectedPath(window.location.pathname)) {
        router.push('/');
      }
    },
    // onError가 없으면 실패해도 isPending만 풀리고 화면은 그대로라 "눌렀는데
    // 아무 일도 안 일어난" 것처럼 보인다. 상태 정리(reset·캐시 제거·이동)는
    // 실제로 로그아웃에 성공했을 때만 의미가 있어 onSuccess에만 둔다 — 여기선
    // 에러 메시지만 노출한다.
    onError: () => {},
  });

  const errorMessage =
    mutation.error instanceof ApiError ? mutation.error.message : null;

  return {
    handleLogout: () => mutation.mutate(),
    isPending: mutation.isPending,
    errorMessage,
  };
}
