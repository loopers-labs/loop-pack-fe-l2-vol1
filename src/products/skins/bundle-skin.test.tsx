import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BundleSkin } from "./bundle-skin";
import type { BundleOption } from "@/products/api/types";

afterEach(cleanup);

// s2 route(src/mocks/handlers.ts)의 b1/b2와 정합.
const bundleOptions: BundleOption[] = [
  { id: "b1", label: "10개입", price: 21000, unitPrice: 2100, stock: 9 },
  { id: "b2", label: "1개", price: 4200, unitPrice: 4200, stock: 6 },
];

describe("BundleSkin", () => {
  it("b1을 선택했다가 b2로 바꾸면 readout이 b1 요약에서 b2 요약으로 전이된다", async () => {
    const user = userEvent.setup();
    render(<BundleSkin options={bundleOptions} />);

    await user.click(
      screen.getByRole("button", { name: "10개입 · 21,000원 · 1개당 2,100원 · 무료배송" }),
    );

    expect(screen.getByText("21,000원 · 1개당 2,100원 · 무료배송")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "1개 · 4,200원 · 1개당 4,200원 · 무료배송" }),
    );

    expect(screen.getByText("4,200원 · 1개당 4,200원 · 무료배송")).toBeInTheDocument();
    expect(screen.queryByText("21,000원 · 1개당 2,100원 · 무료배송")).not.toBeInTheDocument();
  });
});
