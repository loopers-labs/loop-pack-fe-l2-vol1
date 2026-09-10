import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_QUERY_KEY } from "@/entities/session";
import { buildAuthUser } from "@/test/msw/fixtures";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render-with-providers";
import { HeaderAuth } from "./header-auth";

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

describe("HeaderAuth", () => {
  beforeEach(() => {
    router.push.mockReset();
  });

  it("서버가 준 초기값이 없으면 로그인 링크를 보여준다", () => {
    renderWithProviders(<HeaderAuth initialUser={null} />);

    expect(screen.getByRole("link", { name: "로그인" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("button", { name: "로그아웃" })).not.toBeInTheDocument();
  });

  it("서버가 준 사용자를 첫 렌더부터 보여준다", () => {
    renderWithProviders(<HeaderAuth initialUser={buildAuthUser()} />);

    expect(screen.getByText("루퍼1님")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "마이페이지" })).toHaveAttribute("href", "/mypage");
    expect(screen.getByRole("link", { name: "주문 내역" })).toHaveAttribute("href", "/orders");
  });

  it("로그아웃하면 세션 캐시가 비고 홈으로 이동하며 로그인 링크로 돌아간다", async () => {
    const user = userEvent.setup();
    const { queryClient } = renderWithProviders(<HeaderAuth initialUser={buildAuthUser()} />);

    await user.click(screen.getByRole("button", { name: "로그아웃" }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"));
    expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toBeNull();
    expect(screen.getByRole("link", { name: "로그인" })).toBeInTheDocument();
  });

  it("로그아웃 요청이 실패해도 세션 캐시를 비우고 홈으로 이동한다", async () => {
    // 만료 경로와 같은 정책 — 서버 응답과 무관하게 클라이언트는 로그아웃 상태로 수렴한다
    server.use(http.post("/api/auth/logout", () => new HttpResponse(null, { status: 500 })));
    const user = userEvent.setup();
    const { queryClient } = renderWithProviders(<HeaderAuth initialUser={buildAuthUser()} />);

    await user.click(screen.getByRole("button", { name: "로그아웃" }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"));
    expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toBeNull();
    expect(screen.getByRole("link", { name: "로그인" })).toBeInTheDocument();
  });
});
