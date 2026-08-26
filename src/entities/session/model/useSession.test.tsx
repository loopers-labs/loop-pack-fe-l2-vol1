// @vitest-environment jsdom
// 세션 훅 통합 테스트 — 200(로그인)/401(미로그인)을 공개 API 반환값으로만 검증.
// 네트워크는 MSW 로 가로챈다. 기본 핸들러엔 /api/auth/me 가 없으므로(onUnhandledRequest:"error")
// 각 테스트가 server.use(http.get(...)) 로 자기 응답을 등록한다.

import type { ReactNode } from "react";
import { afterEach, describe, expect, test } from "vitest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClientProvider } from "@tanstack/react-query";
import { useSession } from "@/entities/session";
import { makeQueryClient } from "@/shared/api";
import { server } from "@/__tests__/msw/server";

const ME_ENDPOINT = "/api/auth/me";
const user = { id: "u1", name: "홍길동", email: "hong@example.com" };

function renderSession() {
  const queryClient = makeQueryClient();

  return renderHook(() => useSession(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

afterEach(cleanup);

describe("useSession", () => {
  test("200 이면 로그인 상태로 그 사용자를 돌려준다", async () => {
    server.use(http.get(ME_ENDPOINT, () => HttpResponse.json({ user })));

    const { result } = renderSession();

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(user);
  });

  test("401 이면 로그아웃 상태로 환원된다", async () => {
    server.use(
      http.get(ME_ENDPOINT, () => new HttpResponse(null, { status: 401 })),
    );

    const { result } = renderSession();

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});
