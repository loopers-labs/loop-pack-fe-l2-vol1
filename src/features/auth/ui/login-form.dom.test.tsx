import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_QUERY_KEY, useSession } from "@/entities/session";
import { buildAuthUser } from "@/test/msw/fixtures";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render-with-providers";
import { LoginForm } from "./login-form";
import { SessionBoundary } from "./session-boundary";

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

// 서버가 익명으로 초기 렌더한 헤더를 대신한다. 마운트 시 세션을 재확인한다
function SessionProbe() {
  const { user } = useSession(null);
  return <p>{user === null ? "anonymous" : `${user.name}님`}</p>;
}

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

  it("로그인 전에 시작된 세션 재확인의 401 이 성공 뒤에 도착해도 만료로 읽지 않는다", async () => {
    // 로그인 화면은 마운트 시 세션을 재확인한다(미인증 → 401). 실제 mock 서버는 이 응답에 500ms 지연을 걸어
    // 로그인 성공보다 뒤에 도착할 수 있다. 여기서는 시간 대신 게이트로 그 순서를 강제한다 —
    // 로그인 성공을 확인한 뒤에 게이트를 열어 401 을 내보낸다
    let releaseSession: () => void = () => undefined;
    const sessionGate = new Promise<void>((resolve) => {
      releaseSession = resolve;
    });
    let lateSessionResponded = false;
    server.use(
      http.get("/api/auth/me", async () => {
        await sessionGate;
        lateSessionResponded = true;
        return HttpResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
      }),
    );
    const { queryClient } = renderWithProviders(
      <>
        <SessionBoundary />
        <SessionProbe />
        <LoginForm returnTo="/orders" />
      </>,
    );

    await fillAndSubmit();

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/orders"));
    releaseSession();
    await waitFor(() => expect(lateSessionResponded).toBe(true));
    // 늦은 401 이 나간 뒤에도 로그인 상태가 유지되어야 한다
    expect(screen.getByText("루퍼1님")).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalledWith(expect.stringContaining("reason=expired"));
    expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toEqual(buildAuthUser());
  });

  it("서버 오류(500)면 서버 문구를, 문구가 없으면 기본 문구를 보여준다", async () => {
    server.use(http.post("/api/auth/login", () => new HttpResponse(null, { status: 500 })));
    renderWithProviders(<LoginForm returnTo="/" />);

    await fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent("요청을 처리하지 못했습니다.");
  });
});
