import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { products } from "@/app/api/_data/commerce";
import { renderWithProviders } from "@/test/render";
import { Header } from "@/widgets/header";
import { ProductCardWithActions } from "./ProductCardWithActions";

// 12번 항목 — 담기 → 헤더 개수 · 다시 누르면 빠짐.
//
// 계약은 "entity store가 버튼과 헤더라는 두 조각을 잇는다"다. 함께 렌더해야만 보인다.
// layout.tsx는 렌더하지 않는다(next/font/google과 전역 CSS가 딸려 온다) —
// Header를 직접 조립한다.
//
// 구독 범위(id별인가 store 전체인가)는 이 테스트가 보장하지 않는다.
// 렌더 결과로는 구분되지 않는다 — 전체를 구독해도 계산이 id별이면 화면은 정상이다.

const [first, second] = products;

const renderCards = () =>
  renderWithProviders(
    <>
      <Header />
      <ProductCardWithActions product={first} />
      <ProductCardWithActions product={second} />
    </>,
  );

// 헤더 개수는 <span aria-label="장바구니 3개">다. span은 role이 없어 라벨로 찾는다.
const cartCount = () => screen.getByLabelText(/장바구니 \d+개/);
const wishlistCount = () => screen.getByLabelText(/위시리스트 \d+개/);
const cartButton = (name: string) => screen.getByRole("button", { name: `${name} 장바구니` });
const wishlistButton = (name: string) => screen.getByRole("button", { name: `${name} 위시리스트` });

describe("12번 — 담기 → 헤더 개수", () => {
  it("담으면 헤더 개수가 오르고 버튼이 담김 상태가 된다", async () => {
    const user = userEvent.setup();
    renderCards();

    expect(cartCount()).toHaveAccessibleName("장바구니 0개");
    expect(cartButton(first.name)).toHaveAttribute("aria-pressed", "false");

    await user.click(cartButton(first.name));

    expect(cartCount()).toHaveAccessibleName("장바구니 1개");
    expect(cartButton(first.name)).toHaveAttribute("aria-pressed", "true");
    expect(cartButton(first.name)).toHaveTextContent("담김");
  });

  it("다시 누르면 빠지고 개수도 돌아온다", async () => {
    const user = userEvent.setup();
    renderCards();

    await user.click(cartButton(first.name));
    await user.click(cartButton(first.name));

    // add-only로 구현되면 여기서 1개가 남는다.
    expect(cartCount()).toHaveAccessibleName("장바구니 0개");
    expect(cartButton(first.name)).toHaveAttribute("aria-pressed", "false");
    expect(cartButton(first.name)).toHaveTextContent("담기");
  });

  it("여러 상품을 담으면 담은 수만큼 오른다", async () => {
    const user = userEvent.setup();
    renderCards();

    await user.click(cartButton(first.name));
    await user.click(cartButton(second.name));

    expect(cartCount()).toHaveAccessibleName("장바구니 2개");
  });

  it("다른 상품을 담아도 담지 않은 상품의 버튼 상태는 그대로다", async () => {
    const user = userEvent.setup();
    renderCards();

    await user.click(cartButton(second.name));

    // 상품별 포함 여부 계산이 id를 무시하면 여기서 first도 담김이 된다.
    expect(cartButton(second.name)).toHaveAttribute("aria-pressed", "true");
    expect(cartButton(first.name)).toHaveAttribute("aria-pressed", "false");
  });
});

describe("12번 — 장바구니와 위시리스트는 서로 섞이지 않는다", () => {
  it("찜을 담아도 장바구니 개수는 오르지 않는다", async () => {
    const user = userEvent.setup();
    renderCards();

    await user.click(wishlistButton(first.name));

    // 6주차에 한 store를 둘로 가른 이유가 이것이다.
    expect(wishlistCount()).toHaveAccessibleName("위시리스트 1개");
    expect(cartCount()).toHaveAccessibleName("장바구니 0개");
  });

  it("같은 상품을 장바구니와 위시리스트에 각각 담을 수 있다", async () => {
    const user = userEvent.setup();
    renderCards();

    await user.click(cartButton(first.name));
    await user.click(wishlistButton(first.name));

    expect(cartCount()).toHaveAccessibleName("장바구니 1개");
    expect(wishlistCount()).toHaveAccessibleName("위시리스트 1개");
  });
});

describe("12번 — 테스트 간 격리", () => {
  it("앞선 테스트에서 담은 것이 넘어오지 않는다", () => {
    // store는 모듈 싱글턴이다. 셋업의 resetCart/resetWishlist가 없으면
    // 위 테스트들이 담은 것이 그대로 남아 이 단언이 실패한다.
    renderCards();

    expect(cartCount()).toHaveAccessibleName("장바구니 0개");
    expect(wishlistCount()).toHaveAccessibleName("위시리스트 0개");
  });
});
