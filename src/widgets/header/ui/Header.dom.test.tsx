import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ANONYMOUS, EXPIRED, SESSION_QUERY_KEY, acceptSession } from "@/entities/session";
import { createTestQueryClient, renderWithProviders } from "@/test/render";
import { Header } from "./Header";

// ── 왜 이 파일이 생겼나 ─────────────────────────────────────────────────────
// 채점 피드백(nit): 5단계 E6("초기 HTML의 로그인 상태를 지웠다")이 실패했을 때
// 메시지만 보고 "서버 렌더 실패"인지 "로그인 안 됨"인지 가를 수 없었다.
// 원인은 `로그인 계정 …` 라벨 하나에 두 의미가 겹쳐 있던 것이고, 헤더가
// **세션 미확인**을 미로그인과 같은 모양으로 그리고 있었기 때문이다.
//
// 세 상태가 세 모양이라는 것을 여기서 고정한다. E2E가 아니라 여기다 —
// 헤더는 세션 값 하나를 받아 무엇을 그리는지가 전부라서 브라우저가 필요하지 않다.
// 브라우저가 필요한 반쪽("서버가 보낸 문서에 그 모양이 들어 있는가")만 E2E에 있다.

const USER = { id: "u1", email: "looper1@loopers.im", name: "루퍼1" };

describe("Header — 세션 상태를 세 모양으로 그린다", () => {
  it("서버가 심어 준 로그인 상태는 계정 이름으로 그린다", () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(SESSION_QUERY_KEY, acceptSession(USER));

    renderWithProviders(<Header />, { queryClient });

    expect(screen.getByLabelText("로그인 계정 루퍼1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그아웃" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "주문 내역" })).toBeInTheDocument();
  });

  it("미로그인은 로그인 링크로 그린다", () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(SESSION_QUERY_KEY, ANONYMOUS);

    renderWithProviders(<Header />, { queryClient });

    expect(screen.getByRole("link", { name: "로그인" })).toBeInTheDocument();
    expect(screen.queryByText(/계정 확인 중/)).not.toBeInTheDocument();
  });

  it("만료도 로그인 링크로 그린다 — 만료 문구는 화면 본문이 맡는다", () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(SESSION_QUERY_KEY, EXPIRED);

    renderWithProviders(<Header />, { queryClient });

    expect(screen.getByRole("link", { name: "로그인" })).toBeInTheDocument();
  });

  it("아무도 판정하지 않았으면 미로그인이 아니라 '확인 중'으로 그린다", () => {
    // 서버 주입이 빠진 상태다. (shop) layout을 지나면 여기 오지 않는다.
    // 이 갈래가 없으면 서버 렌더 누락이 미로그인과 같은 화면이 되고,
    // 로그인해 둔 사용자에게 한순간 "로그인"이 보인다.
    renderWithProviders(<Header />);

    expect(screen.getByText(/계정 확인 중/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "로그인" })).not.toBeInTheDocument();
  });
});
