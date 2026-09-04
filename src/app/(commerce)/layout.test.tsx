// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CommerceLayout from "./layout";

// 서버 컴포넌트가 요청 시점 쿠키를 읽으므로 next/headers를 목킹한다.
// 세션 쿠키 없음 → 비로그인 상태로 렌더된다(헤더·본문 렌더 자체는 로그인 여부와 무관).
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: () => undefined }),
}));

// (commerce) 그룹 공통 레이아웃이 헤더를 한 번 렌더하고 페이지 본문(children)을 그 안에 그린다.
// 헤더가 여기 있어야 라우트 전환에도 유지되고, 그룹 밖 /demo에는 붙지 않는다(폴더 구조로 보장).
describe("(commerce) layout", () => {
  it("헤더와 페이지 본문을 함께 렌더한다", async () => {
    // async Server Component라 함수를 await해 렌더 결과를 얻은 뒤 렌더한다.
    render(await CommerceLayout({ children: <div>페이지 본문</div> }));

    expect(screen.getByRole("link", { name: "상품" })).toBeInTheDocument();
    expect(screen.getByText("페이지 본문")).toBeInTheDocument();
  });
});
