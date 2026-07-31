import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createAdvancedAProducts } from "../_data/advanced-a-products";
import { createAdvancedAFavoritesStore } from "../_store/favorites-store";
import { AdvancedAProductList } from "./advanced-a-product-list";

describe("Advanced A product list", () => {
  it("renders all 24 cards with fixed favorites and required calculation output", () => {
    const markup = renderToStaticMarkup(
      <AdvancedAProductList
        products={createAdvancedAProducts()}
        store={createAdvancedAFavoritesStore()}
      />,
    );

    expect(markup.match(/data-week07-card-id=/g)).toHaveLength(24);
    expect(markup.match(/aria-pressed="true"/g)).toHaveLength(3);
    expect(markup).toContain("에어리 데일리 셔츠 01");
    expect(markup).toContain("작업량 1,375,000");
    expect(markup).toContain("배송 준비 지수");
  });
});
