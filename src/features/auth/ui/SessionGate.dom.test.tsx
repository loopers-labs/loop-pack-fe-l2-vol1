import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ANONYMOUS, EXPIRED, SESSION_QUERY_KEY, acceptSession } from "@/entities/session";
import { createTestQueryClient } from "@/test/render";
import { SessionGate } from "./SessionGate";

// 보호 화면이 지나는 문. 통과 조건은 "세션이 있다" 하나여야 한다.
//
// 처음엔 expired만 막았다. 그러면 로그아웃 직후(anonymous)에 보호 화면이 라우터
// 이동이 끝날 때까지 계속 열려 있다 — 방금 로그아웃한 사람이 자기 주문 내역을
// 계속 보고 있는 창이 생긴다.

const PROTECTED = "보호된 내용";

function renderGate(session: Parameters<typeof acceptSession> | null, state?: unknown) {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(SESSION_QUERY_KEY, state);
  return render(
    <QueryClientProvider client={queryClient}>
      <SessionGate>
        <p>{PROTECTED}</p>
      </SessionGate>
    </QueryClientProvider>,
  );
}

describe("SessionGate — authenticated만 통과시킨다", () => {
  it("로그인 상태면 내용을 그린다", () => {
    renderGate(null, acceptSession({ id: "u1", name: "루퍼1", email: "e@e.dev" }));
    expect(screen.getByText(PROTECTED)).toBeInTheDocument();
  });

  it("만료면 막고 다시 로그인하라고 한다", () => {
    renderGate(null, EXPIRED);
    expect(screen.queryByText(PROTECTED)).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("세션이 만료되었습니다");
  });

  it("로그아웃 직후(anonymous)에도 막는다", () => {
    renderGate(null, ANONYMOUS);
    // 내용이 남아 있으면 방금 로그아웃한 사람이 그걸 계속 본다.
    expect(screen.queryByText(PROTECTED)).not.toBeInTheDocument();
    // 만료와 문구를 가른다 — 만료가 아닌데 만료라고 하면 거짓말이다.
    expect(screen.getByRole("alert")).toHaveTextContent("로그인이 필요한 화면입니다");
  });

  it("세션을 모르면 막는다 — 모른다는 것은 있다가 아니다", () => {
    renderGate(null, undefined);
    expect(screen.queryByText(PROTECTED)).not.toBeInTheDocument();
  });
});
