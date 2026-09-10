import type { AuthUser, SessionResponse } from "@/types/auth";
import { fetchCommerceApi } from "@/shared/api/commerce-client";

// 401 은 그대로 던진다. "로그인 상태였는데 401" 을 만료로 판정하는 일은 features/auth 의 SessionBoundary 가
// 한 채널(쿼리·뮤테이션 에러)로 처리하므로, 여기서 null 로 접으면 만료를 놓치는 두 번째 경로가 생긴다.
// signal 은 쿼리 취소(로그인 성공 직후 등)를 실제 요청 중단으로 이어 준다
export async function getSession(signal?: AbortSignal): Promise<AuthUser> {
  const { user } = await fetchCommerceApi<SessionResponse>("/api/auth/me", { signal });
  return user;
}
