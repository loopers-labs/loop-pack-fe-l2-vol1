// @vitest-environment jsdom
// 초기 로그인 상태 게이팅 통합 테스트 — 서버가 내려준 initialUser(context)가 /me 확정 전 최초 렌더에 그대로 보이는지 검증한다.
// /me 호출은 initialUser 가 있을 때만 일어난다. null(로그아웃)이면 아예 부르지 않는다.
// next/navigation 라우터는 jsdom 에 없어 로그인 케이스의 LogoutButton 이 쓰는 useRouter 만 최소 목으로 대체한다.

import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClientProvider } from "@tanstack/react-query";
import { CommerceHeaderAuth } from "./CommerceHeaderAuth";
import { SessionProvider, type SessionUser } from "@/entities/session";
import { makeQueryClient } from "@/shared/api";
import { server } from "@/__tests__/msw/server";

const SESSION_ENDPOINT = "/api/auth/me";
const user = { id: "u1", name: "홍길동", email: "hong@example.com" };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

function renderHeaderAuth(initialUser: SessionUser | null) {
  render(
    <QueryClientProvider client={makeQueryClient()}>
      <SessionProvider initialUser={initialUser}>
        <CommerceHeaderAuth />
      </SessionProvider>
    </QueryClientProvider>,
  );
}

afterEach(cleanup);

describe("CommerceHeaderAuth", () => {
  test("initialUser 가 있으면 /me 확정 전 최초 렌더에 이름이 보인다", () => {
    server.use(http.get(SESSION_ENDPOINT, () => HttpResponse.json({ user })));

    renderHeaderAuth(user);

    expect(screen.getByText(user.name)).toBeInTheDocument();
  });

  test("initialUser 가 null 이면 로그인 링크를 보이고 /me 를 부르지 않는다", () => {
    // /me 핸들러를 등록하지 않는다 — 호출이 나가면 onUnhandledRequest:"error" 로 실패한다.
    renderHeaderAuth(null);

    expect(screen.getByRole("link", { name: "로그인" })).toBeInTheDocument();
  });

  test("initialUser 가 있어도 /me 가 만료(401)면 로그인 링크로 강등된다", async () => {
    server.use(
      http.get(SESSION_ENDPOINT, () => new HttpResponse(null, { status: 401 })),
    );

    renderHeaderAuth(user);

    expect(
      await screen.findByRole("link", { name: "로그인" }),
    ).toBeInTheDocument();
  });
});
