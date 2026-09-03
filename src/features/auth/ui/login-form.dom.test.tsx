import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_QUERY_KEY } from "@/entities/session";
import { buildAuthUser } from "@/test/msw/fixtures";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render-with-providers";
import { LoginForm } from "./login-form";

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const fillAndSubmit = async (email = "looper1@loopers.dev", password = "looper1234") => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("이메일"), email);
  await user.type(screen.getByLabelText("비밀번호"), password);
  await user.click(screen.getByRole("button", { name: "로그인" }));
};

describe("LoginForm", () => {
  beforeEach(() => {
    router.replace.mockReset();
  });

  it("로그인에 성공하면 세션 캐시를 채우고 복원 경로로 이동한다", async () => {
    const { queryClient } = renderWithProviders(<LoginForm returnTo="/orders" />);

    await fillAndSubmit();

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/orders"));
    expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toEqual(buildAuthUser());
  });

  it("자격 증명이 틀리면 서버 문구를 alert 로 보여주고 이동하지 않는다", async () => {
    server.use(
      http.post("/api/auth/login", () =>
        HttpResponse.json({ message: "이메일 또는 비밀번호를 확인해주세요." }, { status: 401 }),
      ),
    );
    const { queryClient } = renderWithProviders(<LoginForm returnTo="/orders" />);

    await fillAndSubmit("looper1@loopers.dev", "wrong");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "이메일 또는 비밀번호를 확인해주세요.",
    );
    expect(router.replace).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toBeUndefined();
  });

  it("서버 오류(500)면 서버 문구를, 문구가 없으면 기본 문구를 보여준다", async () => {
    server.use(http.post("/api/auth/login", () => new HttpResponse(null, { status: 500 })));
    renderWithProviders(<LoginForm returnTo="/" />);

    await fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent("요청을 처리하지 못했습니다.");
  });
});
