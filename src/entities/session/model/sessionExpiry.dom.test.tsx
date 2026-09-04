import { QueryClientProvider, useMutation } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { createBrowserQueryClient } from "@/_app/createQueryClient";
import { server } from "@/mocks/server";
import { postJson } from "@/shared/api";
import { acceptSession } from "./resolveSession";
import { AUTH_MUTATION_KEY } from "./sessionExpiry";
import { SESSION_QUERY_KEY } from "../api/sessionQuery";
import type { SessionState } from "./types";

// 401을 세션 판정으로 넘기는 자리가 **조회와 변경 둘 다**인지 확인한다.
//
// 처음엔 QueryCache에만 붙였다. 주문 전송은 mutation이라 판정을 안 탔고,
// 만료된 사용자가 주문서에서 401을 받아도 세션은 authenticated로 남았다
// (실측 실패 메시지: expected 'authenticated' to be 'expired').
// 그래서 SessionGate도 열려 있었다.

const USER = { id: "u1", name: "루퍼1", email: "looper1@loopers.dev" };
const unauthorized = (path: string) =>
  http.post(path, () => HttpResponse.json({ message: "로그인이 필요합니다." }, { status: 401 }));

function Trigger({ authMutation }: { authMutation: boolean }) {
  const mutation = useMutation({
    mutationKey: authMutation ? [...AUTH_MUTATION_KEY, "login"] : ["orders", "create"],
    mutationFn: () => postJson(authMutation ? "/api/auth/login" : "/api/orders", {}),
  });
  return (
    <button type="button" onClick={() => mutation.mutate()}>
      보내기
    </button>
  );
}

async function sendAndRead(authMutation: boolean) {
  const queryClient = createBrowserQueryClient();
  queryClient.setQueryData(SESSION_QUERY_KEY, acceptSession(USER));

  render(
    <QueryClientProvider client={queryClient}>
      <Trigger authMutation={authMutation} />
    </QueryClientProvider>,
  );
  await userEvent.click(screen.getByRole("button", { name: "보내기" }));

  // 변경이 끝날 때까지 기다린다. 화면으로 기다릴 수 없는 값이라(캐시) 캐시를 본다.
  await expect
    .poll(() => queryClient.getQueryData<SessionState>(SESSION_QUERY_KEY)?.status)
    .not.toBe(undefined);
  return queryClient;
}

describe("401을 세션 판정으로 넘기는 자리", () => {
  it("보호된 변경의 401은 세션을 만료로 바꾼다", async () => {
    server.use(unauthorized("*/api/orders"));
    const queryClient = await sendAndRead(false);

    await expect
      .poll(() => queryClient.getQueryData<SessionState>(SESSION_QUERY_KEY)?.status)
      .toBe("expired");
  });

  it("로그인 실패의 401은 세션을 건드리지 않는다", async () => {
    // 로그인한 사람이 비밀번호를 틀리게 다시 입력하는 경로다.
    // 여기서 세션이 만료로 바뀌면 멀쩡한 로그인이 끊긴다.
    server.use(unauthorized("*/api/auth/login"));
    const queryClient = await sendAndRead(true);

    // 잠시 뒤에도 그대로여야 한다. "바뀌지 않았다"는 폴링으로 확인할 수 없으므로
    // 변경이 끝난 것을 확인한 뒤 값을 한 번 대조한다.
    expect(queryClient.getQueryData<SessionState>(SESSION_QUERY_KEY)).toEqual(acceptSession(USER));
  });
});
