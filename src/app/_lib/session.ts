import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readSessionToken } from "@/app/api/_data/auth";
import { SESSION_COOKIE } from "@/app/api/_data/auth-cookies";
import { buildLoginUrl } from "@/shared/lib/return-to";
import type { AuthUser } from "@/types/auth";

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

export type ServerSession = {
  // 쿠키가 있는데 user 가 null 이면 만료·위조다. 없으면 로그인한 적이 없는 것
  hasCookie: boolean;
  user: AuthUser | null;
};

// 서버 렌더에서 세션을 읽는 유일한 자리. 서명·만료까지 검증한다 (proxy 는 존재만 본다).
// scenario 노브는 API 응답을 흉내내는 장치라 여기서는 읽지 않는다 — "쿠키는 멀쩡한데 API 가 401" 이
// 실제 만료의 모습이고, 그 처리는 클라이언트의 SessionBoundary 한 곳이 맡는다
export const resolveServerSession = (store: CookieReader, nowMs = Date.now()): ServerSession => {
  const token = store.get(SESSION_COOKIE)?.value;
  return { hasCookie: token !== undefined && token !== "", user: readSessionToken(token, nowMs) };
};

export async function getServerSession(): Promise<AuthUser | null> {
  return resolveServerSession(await cookies()).user;
}

// 보호 페이지의 진입점. 쿠키가 없으면 로그인으로, 있는데 검증에 실패했으면 사유를 붙여 로그인으로 보낸다
export async function requireServerSession(returnTo: string): Promise<AuthUser> {
  const { hasCookie, user } = resolveServerSession(await cookies());
  if (user !== null) {
    return user;
  }

  redirect(buildLoginUrl(returnTo, hasCookie ? "expired" : undefined));
}
