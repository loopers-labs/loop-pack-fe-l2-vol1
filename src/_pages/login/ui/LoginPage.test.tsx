import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "./LoginPage";
import { server } from "@/shared/config/vitest/mswServer";
import { renderWithAppProviders } from "@/shared/testing/renderWithAppProviders";

const routerPush = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPush,
  }),
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

const user = {
  id: "u1",
  name: "루퍼1",
  email: "looper1@loopers.dev",
};

function renderLoginPage(searchParams = "") {
  renderWithAppProviders(<LoginPage />, {
    route: "/login",
    searchParams,
  });
}

describe("LoginPage", () => {
  afterEach(() => {
    cleanup();
    routerPush.mockReset();
  });

  it("이메일과 비밀번호로 로그인하면 복원 경로로 이동한다", async () => {
    let requestBody: unknown;
    server.use(
      http.post("/api/auth/login", async ({ request }) => {
        requestBody = await request.json();

        return HttpResponse.json({ user });
      }),
    );

    renderLoginPage("?redirectTo=/orders");

    await userEvent.type(screen.getByRole("textbox", { name: "이메일" }), user.email);
    await userEvent.type(screen.getByLabelText("비밀번호"), "looper1234");
    await userEvent.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/orders");
    });
    expect(requestBody).toEqual({
      email: user.email,
      password: "looper1234",
    });
  });

  it("로그인 실패 응답을 받으면 API 메시지를 보여주고 이동하지 않는다", async () => {
    server.use(
      http.post("/api/auth/login", () =>
        HttpResponse.json({ message: "이메일 또는 비밀번호를 확인해주세요." }, { status: 401 }),
      ),
    );

    renderLoginPage();

    await userEvent.type(screen.getByRole("textbox", { name: "이메일" }), user.email);
    await userEvent.type(screen.getByLabelText("비밀번호"), "wrong-password");
    await userEvent.click(screen.getByRole("button", { name: "로그인" }));

    expect(await screen.findByText("이메일 또는 비밀번호를 확인해주세요.")).toBeInTheDocument();
    expect(routerPush).not.toHaveBeenCalled();
  });
});
