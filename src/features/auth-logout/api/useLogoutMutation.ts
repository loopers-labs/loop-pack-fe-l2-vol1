'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { SESSION_QUERY_KEY } from '@/entities/session/api/sessionQueryOptions';
import { useCartStore } from '@/entities/cart/model/useCartStore';
import { useWishlistStore } from '@/entities/wishlist/model/useWishlistStore';
import { DEFAULT_REDIRECT_PATH } from '@/shared/lib/safeRedirectPath';
import { syncAnalyticsUser } from '@/analytics/trackEvents';
import { ApiError } from '@/shared/api/response';

const LOGOUT_FAILED_MESSAGE = '로그아웃하지 못했습니다. 잠시 후 다시 시도해 주세요.';

/**
 * 로그아웃하고 클라이언트에 남은 사용자 흔적을 정리한다.
 *
 * 장바구니와 위시리스트를 함께 비운다. 둘 다 sessionStorage에 담기므로 탭을 닫으면
 * 사라지지만, 로그아웃은 탭을 닫는 행동이 아니다. 정리하지 않으면 같은 탭을 이어 쓰는
 * 다음 사람에게 이전 사용자가 담은 목록이 그대로 보인다.
 *
 * 대가는 잠깐 로그아웃했다 돌아온 사용자도 목록을 잃는다는 것이다. 세션과 무관한
 * 브라우저 로컬 상태로 볼 수도 있지만, 노출 쪽을 더 무겁게 봤다.
 */
export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      // 응답을 확인하지 않으면 서버가 실패로 답해도 성공 처리가 이어진다. 그러면 서버에는
      // 로그인이 남았는데 화면만 로그아웃된 것처럼 보이고, 계측의 사용자도 먼저 사라진다
      if (!response.ok) {
        throw new ApiError(response.status, LOGOUT_FAILED_MESSAGE);
      }
    },
    onSuccess: () => {
      // 로그아웃은 시드 로그에 없는 이벤트라 계측하지 않는다.
      // 세션 캐시를 비우는 것이 이후 이벤트에서 userId를 떼는 일이고, 뒤따르는 이벤트가
      // 없어도 프로바이더가 이전 사용자를 붙들지 않도록 여기서 한 번 맞춘다
      queryClient.setQueryData(SESSION_QUERY_KEY, null);
      syncAnalyticsUser();
      clearUserScopedState();
      router.replace(DEFAULT_REDIRECT_PATH);
      // 보호 경로에 서버가 그려둔 화면이 남아 있을 수 있어 서버 렌더를 다시 받는다
      router.refresh();
    },
  });
}

/**
 * 로그인한 사람에게 매인 클라이언트 상태를 초기 상태로 되돌린다.
 *
 * 스토어 필드를 직접 세팅하지 않고 액션을 부른다. 자료구조가 바뀌어도 이 파일은 그대로다.
 * 저장소까지 지우는 건 다음 rehydrate가 지워진 값을 되살리지 않게 하기 위해서다.
 */
function clearUserScopedState(): void {
  useCartStore.getState().clearCart();
  useCartStore.persist.clearStorage();
  useWishlistStore.getState().clearWishlist();
  useWishlistStore.persist.clearStorage();
}
