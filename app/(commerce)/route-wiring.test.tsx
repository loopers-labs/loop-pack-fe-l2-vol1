import { afterEach, describe, expect, it } from "vitest";
import { render as rtlRender } from "@testing-library/react"; // 순수 RTL render만 예외로 직접 가져온다 — layout이 CommerceProviders를 실제로 공급하는지 보려면 mocks/render가 대신 공급하는 provider를 우회해야 한다(list-view.test.tsx와 동일 패턴)
import { cleanup, render, screen } from "../../mocks/render";
import CommerceLayout from "./layout";
import HomePage from "./page";
import ProductsPage from "./products/page";

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

// 위와 같은 구멍이 목록 라우트에도 있다: G1의 정적 3검사는 products/page.tsx가
// 빈 컴포넌트여도 통과한다. 이 스위트는 default export를 렌더해 ListView가 실제로
// 마운트되는지(그래서 필터바의 select 2개가 나오는지) 확인함으로써 그 구멍을 막는다.
describe("app/(commerce)/products/page.tsx 라우트 배선", () => {
  it("렌더하면 ListView가 마운트한 필터바의 카테고리·정렬 select 2개가 나온다", () => {
    render(<ProductsPage />);

    // F5b: 필터바는 pending 분기에서도 마운트되므로 즉시(동기) 조회로 충분하다.
    const comboboxes = screen.getAllByRole("combobox");
    expect(comboboxes).toHaveLength(2);
    // G11: role="combobox"만으로는 손으로 짠 div도 통과한다 — 진짜 <select>인지 확인한다.
    for (const combobox of comboboxes) {
      expect(combobox.tagName).toBe("SELECT");
    }
  });
});

// 위 두 스위트는 mocks/render의 커스텀 render로 렌더한다 — 그 render가 QueryClientProvider·
// NuqsAdapter를 테스트 쪽에서 대신 공급하므로, 실제 layout.tsx가 CommerceProviders를 잃어도
// 전부 초록이다. 이 스위트는 순수 RTL render로 CommerceLayout이 자식을 직접 감싸게 해,
// layout 자신이 provider를 소유하는지를 확인함으로써 그 구멍을 막는다.
describe("app/(commerce)/layout.tsx의 CommerceProviders 배선", () => {
  it("Header가 렌더되고 HomeView의 서버 데이터 기반 배너 제목이 나온다", async () => {
    rtlRender(
      <CommerceLayout>
        <HomePage />
      </CommerceLayout>,
    );

    // Header가 나온다 = CommerceProviders가 마운트됐다.
    expect(screen.getByRole("banner")).toBeInTheDocument();
    // HomeView의 서버 데이터 기반 산출물이 나온다 = QueryClientProvider가 살아 있다.
    expect(
      await screen.findByRole("heading", { level: 1, name: "매일 새롭게 발견하는 취향" }),
    ).toBeInTheDocument();
  });
});
