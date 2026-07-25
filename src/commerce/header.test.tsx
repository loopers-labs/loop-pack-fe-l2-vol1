import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { useCommerceStore } from "./store";
import { Header } from "./header";

afterEach(cleanup);
beforeEach(() => {
  useCommerceStore.setState({ cartIds: new Set(), wishlistIds: new Set() });
});

describe("Header", () => {
  it("renders zero counts on initial render", () => {
    render(<Header />);

    expect(screen.getByText("장바구니 0")).toBeInTheDocument();
    expect(screen.getByText("위시리스트 0")).toBeInTheDocument();
  });

  it("reflects store counts after items are added", () => {
    useCommerceStore.setState({
      cartIds: new Set(["p1", "p2"]),
      wishlistIds: new Set(["p3"]),
    });

    render(<Header />);

    expect(screen.getByText("장바구니 2")).toBeInTheDocument();
    expect(screen.getByText("위시리스트 1")).toBeInTheDocument();
  });

  it("keeps cart and wishlist counts independent", () => {
    useCommerceStore.setState({
      cartIds: new Set(["p1", "p2", "p3"]),
      wishlistIds: new Set(),
    });

    render(<Header />);

    expect(screen.getByText("장바구니 3")).toBeInTheDocument();
    expect(screen.getByText("위시리스트 0")).toBeInTheDocument();
  });

  it("renders a products link with accessible name 상품", () => {
    render(<Header />);

    const link = screen.getByRole("link", { name: "상품" });
    expect(link).toHaveAttribute("href", "/products");
  });

  it("renders a link to the week-04 deliverable", () => {
    render(<Header />);

    const link = screen.getByRole("link", { name: "4주차" });
    expect(link).toHaveAttribute("href", "/week-04");
  });
});
