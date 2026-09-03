import type { AuthUser, SessionResponse } from "@/types/auth";
import { fetchCommerceApi, isUnauthorizedError } from "@/shared/api/commerce-client";

// 미로그인은 정상 상태라 401 을 에러로 던지지 않고 null 로 접는다.
// "로그인 상태였는데 401" 의 판정은 features/auth 의 SessionBoundary 가 맡는다
export async function getSession(): Promise<AuthUser | null> {
  try {
    const { user } = await fetchCommerceApi<SessionResponse>("/api/auth/me");
    return user;
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return null;
    }
    throw error;
  }
}
