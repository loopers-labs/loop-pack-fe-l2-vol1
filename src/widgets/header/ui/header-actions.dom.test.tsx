// src/widgets/header/ui/header-actions.dom.test.tsx
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { HeaderActions } from "./header-actions";

it("초기 상태에서 위시리스트와 장바구니 개수를 0으로 보여준다", () => {
  render(<HeaderActions />);
  expect(screen.getByText("위시리스트 0")).toBeInTheDocument();
  expect(screen.getByText("장바구니 0")).toBeInTheDocument();
});
