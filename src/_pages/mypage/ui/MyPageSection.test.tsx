// @vitest-environment jsdom
// 마이페이지 섹션 통합 테스트 — 인증 시 이름·이메일 노출을 검증한다.
// 접근 가드는 proxy(서버) 담당이라 이 화면은 인증됨을 전제한다(미인증 분기 없음).
// 네트워크는 MSW 로 가로챈다. 기본 핸들러엔 /api/auth/me 가 없으므로 각 테스트가 server.use 로 등록한다.

import { afterEach, describe, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClientProvider } from "@tanstack/react-query";
import { MyPageSection } from "@/_pages/mypage";
import { makeQueryClient } from "@/shared/api";
import { server } from "@/__tests__/msw/server";

const ME_ENDPOINT = "/api/auth/me";
const user = { id: "u1", name: "홍길동", email: "hong@example.com" };

function renderMyPage() {
  render(
    <QueryClientProvider client={makeQueryClient()}>
      <MyPageSection />
    </QueryClientProvider>,
  );
}

afterEach(cleanup);

describe("MyPageSection", () => {
  test("인증되면 이름과 이메일을 보여준다", async () => {
    server.use(http.get(ME_ENDPOINT, () => HttpResponse.json({ user })));

    renderMyPage();

    expect(await screen.findByText(user.name)).toBeInTheDocument();
    expect(screen.getByText(user.email)).toBeInTheDocument();
  });
});
