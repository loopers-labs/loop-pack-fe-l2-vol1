// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/features/auth/ui/LoginForm";
import { routerMock as router } from "@/test/navigation";
import { renderWithProviders } from "@/test/renderWithProviders";
import { server } from "@/test/server";

// next/navigation은 setup.ts에서 전역 목킹한다. router 호출은 그 목 실체(routerMock)로 검증한다.
const trackEvent = vi.hoisted(() => vi.fn());
vi.mock("@/analytics/schema", () => ({ trackEvent }));

beforeEach(() => {
  router.replace.mockClear();
  router.refresh.mockClear();
  trackEvent.mockClear();
});

describe("LoginForm", () => {
  it("로그인 성공하면 복원 경로로 이동하고 서버 상태를 갱신한다", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm redirect="/orders" />);

    await user.type(screen.getByLabelText("이메일"), "looper1@loopers.dev");
    await user.type(screen.getByLabelText("비밀번호"), "looper1234");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    await vi.waitFor(() => expect(router.replace).toHaveBeenCalledWith("/orders"));
    expect(router.refresh).toHaveBeenCalled();
  });

  it("자격 증명이 틀리면(401) 에러를 화면에 보여주고 이동하지 않는다", async () => {
    server.use(
      http.post("*/api/auth/login", () =>
        HttpResponse.json({ message: "이메일 또는 비밀번호를 확인해주세요." }, { status: 401 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<LoginForm redirect={null} />);

    await user.type(screen.getByLabelText("이메일"), "looper1@loopers.dev");
    await user.type(screen.getByLabelText("비밀번호"), "wrong");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "이메일 또는 비밀번호를 확인해주세요.",
    );
    expect(router.replace).not.toHaveBeenCalled();
  });
});

describe("LoginForm 계측", () => {
  it("보호 경로에서 왔으면 login_start의 from에 그 경로를 싣는다", () => {
    renderWithProviders(<LoginForm redirect="/order-form" />);

    expect(trackEvent).toHaveBeenCalledExactlyOnceWith("login_start", { from: "/order-form" });
  });

  it("직접 진입이면 login_start의 from은 direct다", () => {
    renderWithProviders(<LoginForm redirect={null} />);

    expect(trackEvent).toHaveBeenCalledExactlyOnceWith("login_start", { from: "direct" });
  });

  it("로그인에 성공하면 login_success를 from과 함께 찍는다", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm redirect="/orders" />);

    await user.type(screen.getByLabelText("이메일"), "looper1@loopers.dev");
    await user.type(screen.getByLabelText("비밀번호"), "looper1234");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    await vi.waitFor(() =>
      expect(trackEvent).toHaveBeenCalledWith("login_success", { from: "/orders" }),
    );
  });

  it("자격 증명이 틀리면 login_fail을 사유와 함께 찍고 login_success는 찍지 않는다", async () => {
    server.use(
      http.post("*/api/auth/login", () =>
        HttpResponse.json({ message: "이메일 또는 비밀번호를 확인해주세요." }, { status: 401 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<LoginForm redirect={null} />);

    await user.type(screen.getByLabelText("이메일"), "looper1@loopers.dev");
    await user.type(screen.getByLabelText("비밀번호"), "wrong");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    await vi.waitFor(() =>
      expect(trackEvent).toHaveBeenCalledWith("login_fail", {
        reason: "이메일 또는 비밀번호를 확인해주세요.",
      }),
    );
    expect(trackEvent).not.toHaveBeenCalledWith("login_success", expect.anything());
  });
});
