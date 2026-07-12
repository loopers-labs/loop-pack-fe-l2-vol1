import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PurchaseDialog } from "./purchase-dialog";

afterEach(cleanup);

describe("PurchaseDialog", () => {
  it("Trigger를 클릭하면 열리고 상품 정보가 보인다", async () => {
    const user = userEvent.setup();
    render(<PurchaseDialog productName="원목 스탠드 조명" priceLabel="45,000원" />);

    expect(screen.queryByText("원목 스탠드 조명")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "구매하기" }));

    expect(screen.getByText("원목 스탠드 조명")).toBeInTheDocument();
    expect(screen.getByText("45,000원")).toBeInTheDocument();
  });

  it("Close를 클릭하면 닫힌다", async () => {
    const user = userEvent.setup();
    render(<PurchaseDialog productName="원목 스탠드 조명" priceLabel="45,000원" />);

    await user.click(screen.getByRole("button", { name: "구매하기" }));
    expect(screen.getByText("원목 스탠드 조명")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "닫기" }));
    expect(screen.queryByText("원목 스탠드 조명")).not.toBeInTheDocument();
  });

  it("열린 Content 안에는 Select(listbox)가 없다 — Select와 통합되지 않은 별도 구매 표면", async () => {
    const user = userEvent.setup();
    render(<PurchaseDialog productName="원목 스탠드 조명" priceLabel="45,000원" />);

    await user.click(screen.getByRole("button", { name: "구매하기" }));

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });
});
