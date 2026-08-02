import { afterEach, beforeEach, describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { cleanup, render, screen } from "../../../../mocks/render";
import { AddToCartButton } from "./add-to-cart-button";
import { useCartStore } from "../model/store";

afterEach(cleanup);
beforeEach(() => {
  useCartStore.setState({ cartIds: new Set() });
});

const PRODUCT_A = { id: "p1", name: "스탠리 클래식 런치박스" };
const PRODUCT_B = { id: "p2", name: "[1+1] 베이직 무지 롱 슬리브 102-CVL 17수 긴팔티" };

describe("AddToCartButton", () => {
  it("상품명 기반 접근 이름과 false의 초기 aria-pressed를 제공한다", () => {
    render(<AddToCartButton productId={PRODUCT_A.id} productName={PRODUCT_A.name} />);

    expect(screen.getByRole("button", { name: `${PRODUCT_A.name} 장바구니` })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("같은 상품을 다시 클릭하면 aria-pressed가 false로 되돌아온다", async () => {
    const user = userEvent.setup();
    render(<AddToCartButton productId={PRODUCT_A.id} productName={PRODUCT_A.name} />);
    const button = screen.getByRole("button", { name: `${PRODUCT_A.name} 장바구니` });

    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("한 상품의 토글은 다른 상품 버튼에 영향을 주지 않는다", async () => {
    const user = userEvent.setup();
    render(
      <>
        <AddToCartButton productId={PRODUCT_A.id} productName={PRODUCT_A.name} />
        <AddToCartButton productId={PRODUCT_B.id} productName={PRODUCT_B.name} />
      </>,
    );

    await user.click(screen.getByRole("button", { name: `${PRODUCT_A.name} 장바구니` }));

    expect(screen.getByRole("button", { name: `${PRODUCT_B.name} 장바구니` })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
