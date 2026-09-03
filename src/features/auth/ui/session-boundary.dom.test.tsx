import { useQuery } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { orderQueries } from "@/entities/order";
import { SESSION_QUERY_KEY, useSession } from "@/entities/session";
import { buildAuthUser } from "@/test/msw/fixtures";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render-with-providers";
import { SessionBoundary } from "./session-boundary";

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

// 보호 데이터를 요청하는 화면을 대신한다
function OrdersProbe() {
  const { status } = useQuery(orderQueries.list());
  return <p>orders: {status}</p>;
}

// 서버가 로그인 상태로 초기 렌더한 헤더를 대신한다. 마운트 시 세션을 재확인한다
function SessionProbe() {
  const { user } = useSession(buildAuthUser());
  return <p>user: {user?.name ?? "none"}</p>;
}

const unauthorized = () => HttpResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

describe("SessionBoundary", () => {
  beforeEach(() => {
    router.replace.mockReset();
  });

  it("로그인 상태에서 401 을 받으면 쿠키를 지우고 캐시를 비운 뒤 만료 사유를 붙여 로그인으로 보낸다", async () => {
    const logoutCalls = vi.fn();
    server.use(
      http.get("/api/orders", unauthorized),
      http.post("/api/auth/logout", () => {
        logoutCalls();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { queryClient } = renderWithProviders(
      <>
        <SessionBoundary />
        <OrdersProbe />
      </>,
    );
    queryClient.setQueryData(SESSION_QUERY_KEY, buildAuthUser());

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login?reason=expired"));
    expect(logoutCalls).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toBeNull();
    // 주문 캐시는 지워지고, 아직 마운트된 화면이 다시 구독하더라도 데이터는 남아 있지 않다
    expect(queryClient.getQueryData(orderQueries.list().queryKey)).toBeUndefined();
  });

  it("세션 재확인(/api/auth/me)의 401 도 같은 채널로 만료 처리한다", async () => {
    server.use(http.get("/api/auth/me", unauthorized));

    const { queryClient } = renderWithProviders(
      <>
        <SessionBoundary />
        <SessionProbe />
      </>,
    );

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login?reason=expired"));
    expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toBeNull();
  });

  it("미로그인 상태의 401 은 만료가 아니므로 아무것도 하지 않는다", async () => {
    server.use(http.get("/api/orders", unauthorized));

    const { queryClient } = renderWithProviders(
      <>
        <SessionBoundary />
        <OrdersProbe />
      </>,
    );
    queryClient.setQueryData(SESSION_QUERY_KEY, null);

    expect(await screen.findByText("orders: error")).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("401 이 아닌 오류는 각 화면의 몫이라 관여하지 않는다", async () => {
    server.use(
      http.get("/api/orders", () => HttpResponse.json({ message: "점검 중" }, { status: 500 })),
    );

    const { queryClient } = renderWithProviders(
      <>
        <SessionBoundary />
        <OrdersProbe />
      </>,
    );
    queryClient.setQueryData(SESSION_QUERY_KEY, buildAuthUser());

    expect(await screen.findByText("orders: error")).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toEqual(buildAuthUser());
  });
});
