// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LogoutButton } from "@/features/auth/ui/LogoutButton";
import { routerMock as router } from "@/test/navigation";
import { renderWithProviders } from "@/test/renderWithProviders";

// next/navigation은 setup.ts에서 전역 목킹한다. router 호출은 그 목 실체(routerMock)로 검증한다.
beforeEach(() => {
  router.replace.mockClear();
  router.refresh.mockClear();
});

describe("LogoutButton", () => {
  it("로그아웃하면 홈으로 이동하고 서버 상태를 갱신한다", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LogoutButton />);

    await user.click(screen.getByRole("button", { name: "로그아웃" }));

    await vi.waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
    expect(router.refresh).toHaveBeenCalled();
  });
});
