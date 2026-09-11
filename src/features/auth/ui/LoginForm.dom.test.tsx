import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { createBrowserQueryClient } from "@/_app/createQueryClient";
import { SESSION_QUERY_KEY, acceptSession } from "@/entities/session";
import type { SessionState } from "@/entities/session";
import { LOGIN_ENDPOINT } from "@/mocks/handlers";
import { server } from "@/mocks/server";
import { LoginForm } from "./LoginForm";

const USER = { id: "u1", name: "루퍼1", email: "looper1@loopers.dev" };

// 로그인 실패의 401이 **멀쩡한 세션을 만료로 바꾸지 않는지** 확인한다.
//
// 변경 요청의 401은 기본적으로 "세션이 거절됐다"로 본다. 그 기본값이 안전한
// 방향이라서인데, 인증 자체를 다루는 변경은 예외다 — 로그인 실패는 "자격 증명이
// 틀렸다"는 뜻이지 "세션이 만료됐다"가 아니다. 로그인한 사람이 비밀번호를 틀리게
// 다시 입력하는 경로가 실제로 있다.
//
// 예외 처리를 mutationKey로 하므로, useLogin이 그 키를 **실제로 달고 있는지**를
// 여기서 본다. 메커니즘만 따로 검증하면 호출부가 키를 빠뜨려도 초록불이다.
describe("LoginForm — 로그인 실패가 기존 세션을 끊지 않는다", () => {
  it("401을 받아도 세션은 그대로다", async () => {
    const user = userEvent.setup();
    server.use(
      http.post(LOGIN_ENDPOINT, () =>
        HttpResponse.json({ message: "이메일 또는 비밀번호를 확인해주세요." }, { status: 401 }),
      ),
    );

    const queryClient = createBrowserQueryClient();
    queryClient.setQueryData(SESSION_QUERY_KEY, acceptSession(USER));

    render(
      <QueryClientProvider client={queryClient}>
        <LoginForm nextPath={null} />
      </QueryClientProvider>,
    );

    await user.type(screen.getByLabelText("이메일"), USER.email);
    await user.type(screen.getByLabelText("비밀번호"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    // 실패가 화면에 뜬 것으로 요청이 끝난 것을 안다.
    expect(await screen.findByRole("alert")).toHaveTextContent("이메일 또는 비밀번호");

    // 그 뒤 세션을 값으로 대조한다. 만료로 바뀌었다면 여기서 갈린다.
    expect(queryClient.getQueryData<SessionState>(SESSION_QUERY_KEY)).toEqual(acceptSession(USER));
  });
});
