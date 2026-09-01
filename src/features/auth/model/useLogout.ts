'use client';

import { apiClient } from '@/shared/api/apiClient';
import { forgetUser } from '@/shared/lib/analytics/identity';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

/**
 * 로그아웃과 그 계측.
 *
 * 서버 세션만 무효화한다. 장바구니·위시리스트는 zustand persist 로 이 기기에 남는 값이라
 * 건드리지 않는다 — 비로그인에서도 담기가 동작해야 한다는 기준(보호 경로에서 /cart 를 뺀 근거)과
 * 같은 판단이다. 공용 PC 에서 장바구니가 남는다는 한계는 알고 받아들인다.
 *
 * analytics 는 반대로 반드시 끊는다. reset() 을 빠뜨리면 다음 사람의 이벤트에 앞사람의
 * userId 가 계속 붙는다. logger 의 reset 과 공통 프로퍼티의 userId 를 함께 비운다.
 *
 * 로그아웃 API 는 시나리오 노브가 적용되지 않아 항상 204 다. 실패 분기를 따로 두지 않는다.
 */
export function useLogout() {
  const router = useRouter();

  return useMutation({
    mutationFn: () => apiClient.postNoContent('/auth/logout'),
    onSuccess: () => {
      forgetUser();
      // 서버 컴포넌트가 세션 없는 상태로 헤더를 다시 그리게 한다.
      router.refresh();
    },
  });
}
