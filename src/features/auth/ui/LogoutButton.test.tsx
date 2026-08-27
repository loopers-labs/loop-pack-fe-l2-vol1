// @vitest-environment jsdom
// 로그아웃 정리 동작 통합 테스트 — 로그아웃 성공 후 cart·wishlist 가 비워지는 관찰 가능한 결과만 검증한다.
// cart·wishlist store 는 모듈 전역 zustand 싱글턴이라 테스트 간 공유된다 → afterEach 에서 clear 로 초기화.
// 네트워크는 MSW 로 가로채고, next/navigation 라우터는 jsdom 에 없어 refresh 만 최소 목으로 대체한다.

import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { QueryClientProvider } from "@tanstack/react-query";
import { LogoutButton } from "@/features/auth";
import { useCartStore } from "@/entities/cart";
import { useWishlistStore } from "@/entities/wishlist";
import { makeQueryClient } from "@/shared/api";
import { server } from "@/__tests__/msw/server";

const LOGOUT_ENDPOINT = "/api/auth/logout";
const LOGOUT_SUCCESS_STATUS = 204;

const { refreshSpy } = vi.hoisted(() => ({ refreshSpy: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshSpy }),
}));

afterEach(() => {
  cleanup();
  refreshSpy.mockClear();
  // 전역 싱글턴 store 라 seed 한 id 가 다른 테스트로 새지 않게 비운다.
  useCartStore.getState().clear();
  useWishlistStore.getState().clear();
});

describe("LogoutButton", () => {
  test("로그아웃 성공 시 cart·wishlist 가 비워진다", async () => {
    server.use(
      http.post(
        LOGOUT_ENDPOINT,
        () => new HttpResponse(null, { status: LOGOUT_SUCCESS_STATUS }),
      ),
    );
    useCartStore.getState().toggle("p1");
    useWishlistStore.getState().toggle("p2");

    render(
      <QueryClientProvider client={makeQueryClient()}>
        <LogoutButton />
      </QueryClientProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "로그아웃" }));

    await waitFor(() => {
      expect(useCartStore.getState().ids.size).toBe(0);
      expect(useWishlistStore.getState().ids.size).toBe(0);
    });
  });
});
