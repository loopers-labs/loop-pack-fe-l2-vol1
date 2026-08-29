import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrderPage } from "./OrderPage";

describe("OrderPage", () => {
  it("주문서 페이지는 주문서 제목을 보여준다", () => {
    render(<OrderPage />);

    expect(screen.getByRole("heading", { name: "주문서", level: 1 })).toBeInTheDocument();
  });
});
