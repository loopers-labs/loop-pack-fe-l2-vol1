import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/mocks/server";
import { createTestQueryClient } from "@/test/render";
import { ANONYMOUS, EXPIRED } from "../model/resolveSession";
import type { SessionState } from "../model/types";
import { SESSION_QUERY_KEY, sessionQueryOptions } from "./sessionQuery";

// 세션 조회가 **직전 상태**를 보는지 확인한다.
//
// 서버는 쿠키를 보고 만료를 판정해 초기 상태로 심어 준다(app/(shop)/layout.tsx).
// 브라우저는 httpOnly 쿠키를 못 보므로, 재조회에서 401을 받았을 때 응답만으로는
// 만료인지 미로그인인지 알 수 없다. 직전 상태를 보지 않으면 심어 준 만료가 첫
// 재조회에 지워지고, 사용자가 보던 문구가 소리 없이 바뀐다.
//
// E2E로는 이 경로를 싸게 만들 수 없다. 문서를 새로 받으면 서버가 다시 심어 주고,
// 클라이언트 재조회만 일으키려면 staleTime 60초를 기다려야 한다.

const SESSION_ENDPOINT = "*/api/auth/me";

const unauthorized = () =>
  http.get(SESSION_ENDPOINT, () =>
    HttpResponse.json({ message: "로그인이 필요합니다." }, { status: 401 }),
  );

function SessionLabel() {
  const { data } = useQuery(sessionQueryOptions());
  return <p>상태: {data?.status ?? "없음"}</p>;
}

describe("sessionQueryOptions — 재조회가 만료를 지우지 않는다", () => {
  it("서버가 심어 준 만료는 401을 다시 받아도 만료로 남는다", async () => {
    server.use(unauthorized());

    const queryClient = createTestQueryClient();
    // 서버 레이아웃이 하는 일과 같다 — 쿠키를 보고 판정한 결과를 심는다.
    queryClient.setQueryData(SESSION_QUERY_KEY, EXPIRED);

    render(
      <QueryClientProvider client={queryClient}>
        <SessionLabel />
      </QueryClientProvider>,
    );
    expect(screen.getByText("상태: expired")).toBeInTheDocument();

    await queryClient.refetchQueries({ queryKey: SESSION_QUERY_KEY });

    // ⚠️ 여기서 화면을 보면 안 된다. 첫 판에 그렇게 썼다가 false green을 만들었다.
    // `refetchQueries`를 await한 직후에는 React가 아직 리렌더하지 않아서, DOM에는
    // 심어 둔 "expired"가 그대로 남아 있다. `findByText("상태: expired")`는 그걸
    // 즉시 찾고 통과한다 — 조회가 anonymous를 돌려주도록 망가뜨려도 초록불이었다.
    //
    // 8주차에 정리한 것과 같은 함정이다. **"바뀌지 않았다"는 조건 기반 대기로
    // 확인할 수 없다.** 폴링은 "아직 안 바뀜"과 "바뀌지 않는 게 맞음"을 구분하지
    // 못한다. 그래서 화면이 아니라 조회 결과를 값으로 대조한다.
    expect(queryClient.getQueryData<SessionState>(SESSION_QUERY_KEY)).toEqual(EXPIRED);
  });

  it("직전이 없으면 401은 anonymous다", async () => {
    server.use(unauthorized());

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <SessionLabel />
      </QueryClientProvider>,
    );

    // 이쪽은 "없음 → anonymous"로 **바뀌는** 것이라 화면으로 기다릴 수 있다.
    expect(await screen.findByText("상태: anonymous")).toBeInTheDocument();
    expect(queryClient.getQueryData<SessionState>(SESSION_QUERY_KEY)).toEqual(ANONYMOUS);
  });
});
