import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readSessionToken } from "@/app/api/auth/session-token";
import { SESSION_COOKIE } from "@/app/api/auth/session-cookie";
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

type SearchParams = Record<string, string | string[] | undefined>;

// 페이지가 받은 searchParams 를 proxy 가 싣는 것과 같은 모양(`?a=1&b=2`)으로 되돌린다.
// 배열은 같은 키를 반복해 append 한다 — `?tag=a&tag=b` 가 `tag=a,b` 로 뭉개지지 않게
const serializeSearch = (searchParams: SearchParams) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      params.append(key, item);
    }
  }
  const query = params.toString();
  return query === "" ? "" : `?${query}`;
};

// 보호 페이지의 진입점. 쿠키가 없으면 로그인으로, 있는데 검증에 실패했으면 사유를 붙여 로그인으로 보낸다.
// 복원 경로에는 쿼리까지 싣는다 — proxy 가 pathname+search 를 싣는 것과 같은 값이어야
// "어느 관문에서 걸렸나" 에 따라 로그인 뒤 돌아오는 화면이 달라지지 않는다
export async function requireServerSession(
  pathname: string,
  searchParams: SearchParams = {},
): Promise<AuthUser> {
  const { hasCookie, user } = resolveServerSession(await cookies());
  if (user !== null) {
    return user;
  }

  redirect(
    buildLoginUrl(`${pathname}${serializeSearch(searchParams)}`, hasCookie ? "expired" : undefined),
  );
}
