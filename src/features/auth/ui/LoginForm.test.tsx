// @vitest-environment jsdom
// 로그인 폼 통합 테스트 — 성공(세션 설정 + 복원 경로로 이동)과 401(자격증명 오류 안내)만 검증한다.
// LoginForm 은 useSession 으로 /api/auth/me 를 부르므로 각 테스트가 그 응답도 등록한다(기본=미로그인 401).
// next/navigation 라우터는 jsdom 에 없어 최소 목으로 대체하고, replace 만 스파이로 관찰한다.

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { LoginForm } from "@/features/auth";
import { sessionQueries } from "@/entities/session";
import { makeQueryClient } from "@/shared/api";
import { server } from "@/__tests__/msw/server";

const LOGIN_ENDPOINT = "/api/auth/login";
const ME_ENDPOINT = "/api/auth/me";
const CREDENTIALS_ERROR = "이메일 또는 비밀번호를 확인해주세요.";
const user = { id: "u1", name: "홍길동", email: "hong@example.com" };

// replace 는 이동(이미 로그인 or 로그인 성공)의 관찰 지점이라 스파이로 잡고,
// searchParams 는 테스트가 복원 경로를 주입할 수 있게 열어둔다.
const { replaceSpy, searchParams } = vi.hoisted(() => ({
  replaceSpy: vi.fn(),
  searchParams: { value: "" },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceSpy, refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(searchParams.value),
}));

function renderLoginForm(queryClient: QueryClient) {
  render(
    <QueryClientProvider client={queryClient}>
      <LoginForm />
    </QueryClientProvider>,
  );
}

async function submitCredentials() {
  await userEvent.type(screen.getByLabelText("이메일"), "hong@example.com");
  await userEvent.type(screen.getByLabelText("비밀번호"), "pw1234");
  await userEvent.click(screen.getByRole("button", { name: "로그인" }));
}

beforeEach(() => {
  // 로그인 화면 진입 시 useSession 이 부르는 me — 기본은 미로그인(401).
  server.use(
    http.get(ME_ENDPOINT, () => new HttpResponse(null, { status: 401 })),
  );
});

afterEach(() => {
  cleanup();
  replaceSpy.mockClear();
  searchParams.value = "";
});

describe("LoginForm", () => {
  test("로그인 성공 시 세션이 채워지고 복원 경로로 이동한다", async () => {
    searchParams.value = "redirectUrl=/orders";
    server.use(http.post(LOGIN_ENDPOINT, () => HttpResponse.json({ user })));

    const queryClient = makeQueryClient();
    renderLoginForm(queryClient);
    await submitCredentials();

    await waitFor(() => expect(replaceSpy).toHaveBeenCalledWith("/orders"));
    // 세션 캐시가 로그인 사용자로 채워져 useSession 소비처가 재요청 없이 로그인 상태가 된다.
    expect(queryClient.getQueryData(sessionQueries.me().queryKey)).toEqual({
      user,
    });
  });

  test("401 이면 자격증명 오류 문구를 보여주고 이동하지 않는다", async () => {
    server.use(
      http.post(
        LOGIN_ENDPOINT,
        () =>
          new HttpResponse(JSON.stringify({ message: "unauthorized" }), {
            status: 401,
          }),
      ),
    );

    renderLoginForm(makeQueryClient());
    await submitCredentials();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      CREDENTIALS_ERROR,
    );
    expect(replaceSpy).not.toHaveBeenCalled();
  });
});
