import { afterEach, describe, expect, it } from "vitest";
import { cleanup, screen } from "@testing-library/react";
import { render } from "../../mocks/render";
import HomePage from "./page";

afterEach(cleanup); // globals:false라 RTL 자동 cleanup이 등록되지 않는다

// G1의 정적 3검사(app/page.tsx 부재·app-paths-manifest·index.html href)는 전부
// page.tsx가 빈 컴포넌트여도 통과한다 — HomeView를 실제로 마운트하지 않아도 되기 때문이다.
// 이 스위트는 default export를 렌더해 홈 고유 산출물(서버 데이터 기반 배너 제목)이
// 실제로 나오는지 확인함으로써 그 구멍을 막는다.
describe("app/(commerce)/page.tsx 라우트 배선", () => {
  it("렌더하면 HomeView가 서버 데이터로 채운 배너 제목이 h1으로 나온다", async () => {
    render(<HomePage />);

    expect(
      await screen.findByRole("heading", { level: 1, name: "매일 새롭게 발견하는 취향" }),
    ).toBeInTheDocument();
  });
});
