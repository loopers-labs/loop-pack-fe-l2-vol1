// @vitest-environment jsdom
// initialUser 게이팅 통합 테스트 — 서버가 읽은 초기 로그인 상태가 /me 확정 전 최초 렌더에 그대로 보이는지만 검증한다.
// 최초 렌더(isPending) 관찰이 핵심이라 1·2번은 동기 쿼리로 잡고, 3번은 실시간 값 인계를 findBy 로 확인한다.
// next/navigation 라우터는 jsdom 에 없어 로그인 케이스의 LogoutButton 이 쓰는 useRouter 만 최소 목으로 대체한다.

import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClientProvider } from "@tanstack/react-query";
import { CommerceHeaderAuth } from "./CommerceHeaderAuth";
import { makeQueryClient } from "@/shared/api";
import { server } from "@/__tests__/msw/server";

const SESSION_ENDPOINT = "/api/auth/me";
const user = { id: "u1", name: "홍길동", email: "hong@example.com" };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

function renderHeaderAuth(initialUser: typeof user | null) {
  render(
    <QueryClientProvider client={makeQueryClient()}>
      <CommerceHeaderAuth initialUser={initialUser} />
    </QueryClientProvider>,
  );
}

afterEach(cleanup);

describe("CommerceHeaderAuth", () => {
  test("initialUser 가 있으면 /me 확정 전 최초 렌더에 이름이 보인다", () => {
    server.use(
      http.get(SESSION_ENDPOINT, () => new HttpResponse(null, { status: 401 })),
    );

    renderHeaderAuth(user);

    expect(screen.getByText(user.name)).toBeInTheDocument();
  });

  test("initialUser 가 null 이면 최초 렌더에 로그인 링크가 보인다", () => {
    server.use(
      http.get(SESSION_ENDPOINT, () => new HttpResponse(null, { status: 401 })),
    );

    renderHeaderAuth(null);

    expect(screen.getByRole("link", { name: "로그인" })).toBeInTheDocument();
  });

  test("/me 가 로그인 사용자로 확정되면 실시간 값이 initialUser 를 인계한다", async () => {
    server.use(http.get(SESSION_ENDPOINT, () => HttpResponse.json({ user })));

    renderHeaderAuth(null);

    expect(await screen.findByText(user.name)).toBeInTheDocument();
  });
});
