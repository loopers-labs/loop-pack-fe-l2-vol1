import { afterEach, beforeEach, describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { cleanup, render, screen, waitFor } from "../../mocks/render";
import { useCartStore } from "@/features/add-to-cart/model/store";
import { useWishlistStore } from "@/features/toggle-wishlist/model/store";
import { Header } from "@/widgets/header";
import { getHomeData } from "./api/home";
import { HomeView } from "./home-view";
import { ListView } from "./list-view";

afterEach(cleanup); // globals:false라 RTL 자동 cleanup이 등록되지 않는다
beforeEach(() => {
  useCartStore.setState({ cartIds: new Set() });
  useWishlistStore.setState({ wishlistIds: new Set() });
});

// 홈 신상품 섹션과 목록 1페이지(기본 정렬 latest)에 함께 나타나는 상품(p26)을 통해
// feature별 Zustand store가 두 화면에서 실제로 같은 소스인지 검증한다. 각 컴포넌트가
// 로컬 useState로 담김 여부를 들고 있어도 개별 버튼 스위트는
// 통과하므로, 홈·목록을 한 트리에 함께 렌더하는 이 스위트만이 그 오귀속을 잡는다.
describe("home-list-sync", () => {
  it("홈 신상품과 목록 1페이지에 공통으로 나타나는 상품의 담기·찜 상태가 하나의 store로 동기화된다", async () => {
    const user = userEvent.setup();
    const home = getHomeData();
    const shared = home.newProducts.find((product) => product.id === "p26");
    if (shared === undefined) {
      throw new Error("픽스처에 p26(홈 신상품·목록 1페이지 공통 상품)이 없다 — 전제가 깨졌다");
    }

    render(
      <>
        <Header />
        <HomeView />
        <ListView />
      </>,
    );

    // 홈과 목록 각각 useQuery로 비동기 로드되므로, 두 화면의 버튼이 함께 나타날 때까지 기다린다.
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: `${shared.name} 장바구니` })).toHaveLength(2);
    });

    const cartButtons = screen.getAllByRole("button", { name: `${shared.name} 장바구니` });
    const wishlistButtons = screen.getAllByRole("button", {
      name: `${shared.name} 위시리스트`,
    });
    expect(wishlistButtons).toHaveLength(2);

    // 한쪽(목록/홈 어느 카드든)만 클릭한다 — 상품은 하나, 화면은 둘이다.
    await user.click(cartButtons[0]);

    const cartButtonsAfterClick = screen.getAllByRole("button", {
      name: `${shared.name} 장바구니`,
    });
    expect(cartButtonsAfterClick).toHaveLength(2);
    for (const button of cartButtonsAfterClick) {
      expect(button).toHaveAttribute("aria-pressed", "true");
    }
    for (const button of wishlistButtons) {
      expect(button).toHaveAttribute("aria-pressed", "false");
    }
    // 클릭은 1회, 상품도 1종 — 카드가 2장이라 개수가 2가 되면 store가 카드별로 쪼개져 있다는 뜻이다.
    expect(screen.getByText("장바구니 1")).toBeInTheDocument();

    await user.click(wishlistButtons[0]);

    const wishlistButtonsAfterClick = screen.getAllByRole("button", {
      name: `${shared.name} 위시리스트`,
    });
    expect(wishlistButtonsAfterClick).toHaveLength(2);
    for (const button of wishlistButtonsAfterClick) {
      expect(button).toHaveAttribute("aria-pressed", "true");
    }
    expect(screen.getByText("위시리스트 1")).toBeInTheDocument();
  });
});
