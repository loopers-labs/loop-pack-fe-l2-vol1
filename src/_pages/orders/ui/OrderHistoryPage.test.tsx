import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrderHistoryPage } from "./OrderHistoryPage";

describe("OrderHistoryPage", () => {
  it("주문 내역 페이지는 주문 내역 제목과 빈 상태를 보여준다", () => {
    render(<OrderHistoryPage />);

    expect(screen.getByRole("heading", { name: "주문 내역", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("아직 주문 내역이 없습니다.")).toBeInTheDocument();
  });
});
