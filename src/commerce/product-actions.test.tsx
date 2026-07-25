import { afterEach, beforeEach, describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { cleanup, render, screen } from "../../mocks/render";
import { useCommerceStore } from "./store";
import { ProductActions } from "./product-actions";

afterEach(cleanup);
beforeEach(() => {
  useCommerceStore.setState({ cartIds: new Set(), wishlistIds: new Set() });
});

const PRODUCT_A = { id: "p1", name: "스탠리 클래식 런치박스" };
const PRODUCT_B = { id: "p2", name: "[1+1] 베이직 무지 롱 슬리브 102-CVL 17수 긴팔티" };

describe("ProductActions", () => {
  it("접근 이름이 상품명 기반이고 초기 aria-pressed는 둘 다 false다", () => {
    render(<ProductActions productId={PRODUCT_A.id} productName={PRODUCT_A.name} />);

    const cartButton = screen.getByRole("button", { name: `${PRODUCT_A.name} 장바구니` });
    const wishlistButton = screen.getByRole("button", { name: `${PRODUCT_A.name} 위시리스트` });

    expect(cartButton).toHaveAttribute("aria-pressed", "false");
    expect(wishlistButton).toHaveAttribute("aria-pressed", "false");
  });

  it("담기 클릭 시 해당 버튼만 aria-pressed=true가 되고 찜은 false로 유지된다", async () => {
    const user = userEvent.setup();
    render(<ProductActions productId={PRODUCT_A.id} productName={PRODUCT_A.name} />);

    await user.click(screen.getByRole("button", { name: `${PRODUCT_A.name} 장바구니` }));

    expect(screen.getByRole("button", { name: `${PRODUCT_A.name} 장바구니` })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: `${PRODUCT_A.name} 위시리스트` })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("같은 버튼을 다시 클릭하면 aria-pressed가 false로 되돌아온다", async () => {
    const user = userEvent.setup();
    render(<ProductActions productId={PRODUCT_A.id} productName={PRODUCT_A.name} />);
    const cartButton = screen.getByRole("button", { name: `${PRODUCT_A.name} 장바구니` });

    await user.click(cartButton);
    await user.click(cartButton);

    expect(cartButton).toHaveAttribute("aria-pressed", "false");
  });

  it("서로 다른 두 상품을 함께 렌더했을 때 한쪽 토글이 다른 쪽에 영향을 주지 않는다", async () => {
    const user = userEvent.setup();
    render(
      <>
        <ProductActions productId={PRODUCT_A.id} productName={PRODUCT_A.name} />
        <ProductActions productId={PRODUCT_B.id} productName={PRODUCT_B.name} />
      </>,
    );

    await user.click(screen.getByRole("button", { name: `${PRODUCT_A.name} 장바구니` }));

    expect(screen.getByRole("button", { name: `${PRODUCT_A.name} 장바구니` })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: `${PRODUCT_B.name} 장바구니` })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: `${PRODUCT_B.name} 위시리스트` })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
