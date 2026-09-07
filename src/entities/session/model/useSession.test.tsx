// @vitest-environment jsdom
// 세션 훅 통합 테스트 — /me 호출 여부는 서버가 내려준 initialUser(context)로 갈린다.
// initialUser 있음(로그인) → /me 로 확정, null(로그아웃) → /me 를 아예 부르지 않는다.
// 네트워크는 MSW 로 가로챈다(onUnhandledRequest:"error" 라 부르지 말아야 할 /me 가 나가면 즉시 실패).

import type { ReactNode } from "react";
import { afterEach, describe, expect, test } from "vitest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  useSession,
  SessionProvider,
  type SessionUser,
} from "@/entities/session";
import { makeQueryClient } from "@/shared/api";
import { server } from "@/__tests__/msw/server";

const ME_ENDPOINT = "/api/auth/me";
const user = { id: "u1", name: "홍길동", email: "hong@example.com" };

function renderSession(initialUser: SessionUser | null) {
  const queryClient = makeQueryClient();

  return renderHook(() => useSession(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <SessionProvider initialUser={initialUser}>{children}</SessionProvider>
      </QueryClientProvider>
    ),
  });
}

afterEach(cleanup);

describe("useSession", () => {
  test("initialUser 가 있으면 /me 로 로그인 사용자를 확정한다", async () => {
    server.use(http.get(ME_ENDPOINT, () => HttpResponse.json({ user })));

    const { result } = renderSession(user);

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(user);
  });

  test("initialUser 가 null 이면 미로그인이고 /me 를 부르지 않는다", () => {
    // /me 핸들러를 등록하지 않는다 — 호출이 나가면 onUnhandledRequest:"error" 로 실패한다.
    const { result } = renderSession(null);

    expect(result.current.isPending).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  test("initialUser 가 있어도 /me 가 401 이면 로그아웃으로 환원된다", async () => {
    server.use(
      http.get(ME_ENDPOINT, () => new HttpResponse(null, { status: 401 })),
    );

    const { result } = renderSession(user);

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});
