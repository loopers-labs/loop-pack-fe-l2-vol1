import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

// Vitest + React Testing Library + jsdom 스택이 실제로 배선되어 있는지 증명하는 스모크 테스트.
// 다른 src 피처를 import하지 않는다 (depcruise no-cross-feature 위반 방지).
describe("vitest 테스트 인프라", () => {
  it("React 엘리먼트를 jsdom에 렌더링하고 텍스트를 조회할 수 있다", () => {
    render(<button>hello vitest</button>);

    expect(screen.getByRole("button", { name: "hello vitest" })).toBeInTheDocument();
  });
});
